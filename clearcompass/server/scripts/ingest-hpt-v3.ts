#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { writeFileSync } from 'fs';
import { pipeline } from 'stream/promises';
import winston from 'winston';

const prisma = new PrismaClient();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/ingest.log' })
  ]
});

interface HPTRecord {
  hospital_id: string;
  hospital_name: string;
  city: string;
  state: string;
  zip_code?: string;
  latitude?: string;
  longitude?: string;
  code_type: string;
  code: string;
  description?: string;
  payer?: string;
  rate_type: string; // 'negotiated', 'cash', 'min', 'max'
  price: string;
  updated_at?: string;
}

interface ProcessingStats {
  totalRecords: number;
  hospitalsCreated: number;
  pricesCreated: number;
  summariesCreated: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

async function downloadHPTData(url: string, outputPath: string): Promise<void> {
  logger.info(`Downloading HPT data from ${url}`);
  
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream'
  });

  const writer = require('fs').createWriteStream(outputPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function ingestHPTData(csvPath: string): Promise<ProcessingStats> {
  const stats: ProcessingStats = {
    totalRecords: 0,
    hospitalsCreated: 0,
    pricesCreated: 0,
    summariesCreated: 0,
    errors: 0,
    startTime: new Date()
  };

  const hospitalCache = new Map<string, string>(); // hospitalId -> prisma id
  const batchSize = 1000;
  let batch: HPTRecord[] = [];

  logger.info('Starting HPT data ingestion');

  try {
    await pipeline(
      createReadStream(csvPath),
      csv(),
      async function* (source) {
        for await (const record of source) {
          stats.totalRecords++;
          
          try {
            // Validate required fields
            if (!record.hospital_id || !record.code || !record.price) {
              stats.errors++;
              continue;
            }

            batch.push(record as HPTRecord);

            if (batch.length >= batchSize) {
              const batchStats = await processBatch(batch, hospitalCache);
              stats.hospitalsCreated += batchStats.hospitalsCreated;
              stats.pricesCreated += batchStats.pricesCreated;
              stats.errors += batchStats.errors;
              
              batch = [];
              
              if (stats.totalRecords % 10000 === 0) {
                logger.info(`Processed ${stats.totalRecords} records`);
              }
            }
          } catch (error) {
            logger.error(`Error processing record: ${error}`);
            stats.errors++;
          }
        }
      }
    );

    // Process remaining batch
    if (batch.length > 0) {
      const batchStats = await processBatch(batch, hospitalCache);
      stats.hospitalsCreated += batchStats.hospitalsCreated;
      stats.pricesCreated += batchStats.pricesCreated;
      stats.errors += batchStats.errors;
    }

    // Generate price summaries
    logger.info('Generating price summaries...');
    stats.summariesCreated = await generatePriceSummaries();

  } catch (error) {
    logger.error(`Ingestion failed: ${error}`);
    throw error;
  }

  stats.endTime = new Date();
  return stats;
}

async function processBatch(
  batch: HPTRecord[], 
  hospitalCache: Map<string, string>
): Promise<{ hospitalsCreated: number; pricesCreated: number; errors: number }> {
  const stats = { hospitalsCreated: 0, pricesCreated: 0, errors: 0 };

  try {
    // Group by hospital to minimize database calls
    const hospitalGroups = new Map<string, HPTRecord[]>();
    
    for (const record of batch) {
      if (!hospitalGroups.has(record.hospital_id)) {
        hospitalGroups.set(record.hospital_id, []);
      }
      hospitalGroups.get(record.hospital_id)!.push(record);
    }

    // Process each hospital group
    for (const [hospitalId, records] of hospitalGroups) {
      // Type assertion to ensure hospitalId is string
      const safeHospitalId = hospitalId as string;
      
      try {
        // Ensure hospital exists
        let prismaHospitalId: string | undefined = hospitalCache.get(safeHospitalId);
        if (prismaHospitalId == undefined) {
          const firstRecord = records[0];
          const hospital = await prisma.hospital.upsert({
            where: { hospitalId: safeHospitalId },
            update: {
              name: firstRecord.hospital_name,
              city: firstRecord.city,
              state: firstRecord.state,
              zipCode: firstRecord.zip_code,
              lat: firstRecord.latitude ? parseFloat(firstRecord.latitude) : null,
              lon: firstRecord.longitude ? parseFloat(firstRecord.longitude) : null
            },
            create: {
              hospitalId: safeHospitalId,
              name: firstRecord.hospital_name,
              city: firstRecord.city,
              state: firstRecord.state,
              zipCode: firstRecord.zip_code,
              lat: firstRecord.latitude ? parseFloat(firstRecord.latitude) : null,
              lon: firstRecord.longitude ? parseFloat(firstRecord.longitude) : null
            }
          });
          
          prismaHospitalId = hospital.id.toString();
          hospitalCache.set(safeHospitalId, prismaHospitalId);
          stats.hospitalsCreated++;
        }

        // At this point, prismaHospitalId is guaranteed to be a string
        const hospitalId: string = prismaHospitalId!;

        // Batch insert prices
        const priceData = records.map(record => ({
          hospitalId: hospitalId,
          codeType: record.code_type.toUpperCase(),
          code: record.code,
          description: record.description || null,
          payer: record.payer || null,
          rateType: record.rate_type.toLowerCase(),
          price: parseFloat(record.price),
          updatedAt: record.updated_at ? new Date(record.updated_at) : new Date()
        }));

        await prisma.price.createMany({
          data: priceData,
          skipDuplicates: true
        });

        stats.pricesCreated += priceData.length;

      } catch (error) {
        logger.error(`Error processing hospital ${safeHospitalId}: ${error}`);
        stats.errors++;
      }
    }

  } catch (error) {
    logger.error(`Batch processing error: ${error}`);
    stats.errors++;
  }

  return stats;
}

async function generatePriceSummaries(): Promise<number> {
  // Clear existing summaries
  await prisma.priceSummary.deleteMany();

  // Generate new summaries using raw SQL for performance
  const result = await prisma.$executeRaw`
    INSERT INTO price_summaries (id, hospital_id, code_type, code, description, cash_price, min_negotiated, max_negotiated, avg_negotiated, updated_at)
    SELECT 
      gen_random_uuid() as id,
      hospital_id,
      code_type,
      code,
      MAX(description) as description,
      MAX(CASE WHEN rate_type = 'cash' THEN price END) as cash_price,
      MIN(CASE WHEN rate_type = 'negotiated' THEN price END) as min_negotiated,
      MAX(CASE WHEN rate_type = 'negotiated' THEN price END) as max_negotiated,
      AVG(CASE WHEN rate_type = 'negotiated' THEN price END) as avg_negotiated,
      NOW() as updated_at
    FROM prices
    GROUP BY hospital_id, code_type, code
  `;

  return Number(result);
}

async function addSampleData(): Promise<void> {
  logger.info('Adding sample aid programs...');

  const sampleAidPrograms = [
    {
      name: 'Hospital Charity Care Program',
      type: 'hospital',
      description: 'Free or reduced-cost care for qualifying patients',
      incomePctFPL: 200,
      insuranceStatus: 'any',
      coverage: 'Full procedure cost',
      requirements: ['Income verification', 'Asset documentation', 'Residency proof'],
      priority: 'High'
    },
    {
      name: 'Massachusetts Free Care Pool',
      type: 'government',
      description: 'State program for uninsured residents',
      incomePctFPL: 150,
      insuranceStatus: 'uninsured',
      residencyRequired: 'Massachusetts',
      coverage: 'Emergency and essential services',
      requirements: ['MA residency', 'Income below 150% FPL', 'Uninsured status'],
      priority: 'High'
    },
    {
      name: 'Patient Advocate Foundation',
      type: 'nonprofit',
      description: 'National nonprofit providing financial assistance',
      incomePctFPL: 300,
      coverage: 'Co-pays, deductibles, and coinsurance',
      applicationUrl: 'https://www.patientadvocate.org',
      requirements: ['Diagnosis verification', 'Financial hardship', 'Insurance coverage'],
      priority: 'Medium'
    }
  ];

  for (const program of sampleAidPrograms) {
    await prisma.aidProgram.upsert({
      where: { name: program.name },
      update: program,
      create: program
    });
  }

  logger.info('Sample data added successfully');
}

async function main() {
  const args = process.argv.slice(2);
  const dataUrl = process.env.HPT_DATA_URL || 'https://raw.githubusercontent.com/dolthub/hospital-price-transparency-v3/main/data.csv';
  const csvPath = args[0] || './data/hpt-v3-data.csv';
  const skipDownload = args.includes('--skip-download');

  try {
    // Download data if not skipping
    if (!skipDownload) {
      await downloadHPTData(dataUrl, csvPath);
    }

    // Ingest data
    const stats = await ingestHPTData(csvPath);

    // Add sample data
    await addSampleData();

    // Log final statistics
    const duration = stats.endTime!.getTime() - stats.startTime.getTime();
    logger.info('Ingestion completed', {
      ...stats,
      durationMs: duration,
      recordsPerSecond: Math.round(stats.totalRecords / (duration / 1000))
    });

    console.log('\n=== HPT v3 Data Ingestion Complete ===');
    console.log(`Total records processed: ${stats.totalRecords.toLocaleString()}`);
    console.log(`Hospitals created/updated: ${stats.hospitalsCreated.toLocaleString()}`);
    console.log(`Prices created: ${stats.pricesCreated.toLocaleString()}`);
    console.log(`Price summaries created: ${stats.summariesCreated.toLocaleString()}`);
    console.log(`Errors: ${stats.errors.toLocaleString()}`);
    console.log(`Duration: ${Math.round(duration / 1000)}s`);

  } catch (error) {
    logger.error('Ingestion failed', { error: logger.error });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
