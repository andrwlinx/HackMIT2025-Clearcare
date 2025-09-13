import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed process...')

  // Create the knee arthroscopy procedure
  const kneeArthroscopy = await prisma.procedure.create({
    data: {
      id: "knee-arthroscopy",
      cptCode: "29881",
      description: "Arthroscopy, knee, surgical; with meniscectomy (including synovectomy)",
      bundleComponents: JSON.stringify(["64450", "01382"]), // Nerve block, anesthesia
      typicalFollowUps: JSON.stringify(["97110", "97140"]) // Physical therapy codes
    }
  })

  // Create insurance plans (6 plan templates)
  const insurancePlans = await Promise.all([
    // PPO Plans
    prisma.insurancePlan.create({
      data: {
        issuer: "Blue Cross Blue Shield",
        planType: "PPO",
        network: "BCBS Network",
        deductible: 1500,
        oopMax: 6000,
        coinsurance: 0.20,
        copayPcp: 25,
        copaySpecialist: 50,
        copayEr: 250,
        effectiveStart: new Date('2024-01-01'),
        coverageRules: {
          create: {
            cptCode: "29881",
            inNetwork: true,
            coinsurance: 0.20,
            copay: 100,
            priorAuth: false
          }
        }
      }
    }),
    
    // HMO Plan
    prisma.insurancePlan.create({
      data: {
        issuer: "Kaiser Permanente",
        planType: "HMO",
        network: "Kaiser Network",
        deductible: 500,
        oopMax: 4000,
        coinsurance: 0.10,
        copayPcp: 20,
        copaySpecialist: 40,
        copayEr: 150,
        effectiveStart: new Date('2024-01-01'),
        coverageRules: {
          create: {
            cptCode: "29881",
            inNetwork: true,
            coinsurance: 0.10,
            copay: 75,
            priorAuth: true
          }
        }
      }
    }),

    // High Deductible Health Plan
    prisma.insurancePlan.create({
      data: {
        issuer: "Aetna",
        planType: "HDHP",
        network: "Aetna Choice",
        deductible: 3000,
        oopMax: 7000,
        coinsurance: 0.30,
        copayPcp: 0, // No copay until deductible met
        copaySpecialist: 0,
        copayEr: 0,
        effectiveStart: new Date('2024-01-01'),
        coverageRules: {
          create: {
            cptCode: "29881",
            inNetwork: true,
            coinsurance: 0.30,
            copay: 0,
            priorAuth: false
          }
        }
      }
    })
  ])

  // Create facilities with enhanced data
  const facilities = await Promise.all([
    prisma.facility.create({
      data: {
        name: "Boston Medical Center",
        npi: "1234567890",
        address: "1 Boston Medical Center Pl, Boston, MA 02118",
        lat: 42.3356,
        lng: -71.0728,
        networkTags: JSON.stringify(["BCBS Network", "Aetna Choice"]),
        qualityScore: 4.2,
        readmitRate: 0.08,
        hcahpsScore: 4.1,
        complicationRate: 0.02,
        negotiatedRates: {
          create: {
            cptCode: "29881",
            cashPrice: 8500,
            minAllowed: 3200,
            maxAllowed: 6800,
            payerAllowed: 4500
          }
        },
        paymentPlans: {
          create: [
            {
              name: "12-Month Plan",
              months: 12,
              apr: 0.0,
              fees: 0,
              eligibilityNotes: "Available for amounts over $1,000"
            },
            {
              name: "24-Month Plan",
              months: 24,
              apr: 0.059,
              fees: 25,
              eligibilityNotes: "Credit check required"
            }
          ]
        }
      }
    }),

    prisma.facility.create({
      data: {
        name: "Massachusetts General Hospital",
        npi: "2345678901",
        address: "55 Fruit St, Boston, MA 02114",
        lat: 42.3634,
        lng: -71.0685,
        networkTags: JSON.stringify(["BCBS Network", "Kaiser Network"]),
        qualityScore: 4.8,
        readmitRate: 0.05,
        hcahpsScore: 4.6,
        complicationRate: 0.01,
        negotiatedRates: {
          create: {
            cptCode: "29881",
            cashPrice: 12000,
            minAllowed: 4800,
            maxAllowed: 9200,
            payerAllowed: 6500
          }
        },
        paymentPlans: {
          create: [
            {
              name: "6-Month Plan",
              months: 6,
              apr: 0.0,
              fees: 0,
              eligibilityNotes: "No credit check required"
            },
            {
              name: "18-Month Plan",
              months: 18,
              apr: 0.079,
              fees: 50,
              eligibilityNotes: "Available for qualified applicants"
            }
          ]
        }
      }
    }),

    prisma.facility.create({
      data: {
        name: "Brigham and Women's Hospital",
        npi: "3456789012",
        address: "75 Francis St, Boston, MA 02115",
        lat: 42.3359,
        lng: -71.1067,
        networkTags: JSON.stringify(["BCBS Network", "Aetna Choice"]),
        qualityScore: 4.6,
        readmitRate: 0.06,
        hcahpsScore: 4.4,
        complicationRate: 0.015,
        negotiatedRates: {
          create: {
            cptCode: "29881",
            cashPrice: 10500,
            minAllowed: 4200,
            maxAllowed: 8100,
            payerAllowed: 5800
          }
        },
        paymentPlans: {
          create: [
            {
              name: "Interest-Free Plan",
              months: 12,
              apr: 0.0,
              fees: 0,
              eligibilityNotes: "Available for all patients"
            }
          ]
        }
      }
    }),

    prisma.facility.create({
      data: {
        name: "Cambridge Health Alliance",
        npi: "4567890123",
        address: "1493 Cambridge St, Cambridge, MA 02139",
        lat: 42.3875,
        lng: -71.1355,
        networkTags: JSON.stringify([]), // Out of network
        qualityScore: 3.9,
        readmitRate: 0.10,
        hcahpsScore: 3.8,
        complicationRate: 0.025,
        negotiatedRates: {
          create: {
            cptCode: "29881",
            cashPrice: 7200,
            minAllowed: 2800,
            maxAllowed: 5500,
            payerAllowed: null // Out of network
          }
        },
        paymentPlans: {
          create: [
            {
              name: "Sliding Scale Plan",
              months: 24,
              apr: 0.0,
              fees: 0,
              eligibilityNotes: "Based on income qualification"
            }
          ]
        }
      }
    }),

    prisma.facility.create({
      data: {
        name: "Newton-Wellesley Hospital",
        npi: "5678901234",
        address: "2014 Washington St, Newton, MA 02462",
        lat: 42.3370,
        lng: -71.2092,
        networkTags: JSON.stringify(["BCBS Network"]),
        qualityScore: 4.1,
        readmitRate: 0.07,
        hcahpsScore: 4.0,
        complicationRate: 0.02,
        negotiatedRates: {
          create: {
            cptCode: "29881",
            cashPrice: 9200,
            minAllowed: 3600,
            maxAllowed: 7200,
            payerAllowed: 5200
          }
        },
        paymentPlans: {
          create: [
            {
              name: "Extended Payment Plan",
              months: 36,
              apr: 0.099,
              fees: 75,
              eligibilityNotes: "Minimum $2,000 balance required"
            }
          ]
        }
      }
    })
  ])

  // Create aid programs (12 examples)
  const aidPrograms = await Promise.all([
    // Hospital charity care programs
    prisma.aidProgram.create({
      data: {
        name: "MGH Financial Assistance Program",
        type: "hospital",
        incomePctFPL: 400, // Up to 400% of Federal Poverty Level
        residencyRequired: "Massachusetts",
        insuranceStatus: "any",
        documentsRequired: JSON.stringify(["Tax returns", "Pay stubs", "Bank statements"]),
        applicationUrl: "https://www.massgeneral.org/patient-financial-services",
        description: "Provides free or reduced-cost care based on income and family size."
      }
    }),

    prisma.aidProgram.create({
      data: {
        name: "BMC Charity Care",
        type: "hospital",
        incomePctFPL: 300,
        residencyRequired: "Massachusetts",
        insuranceStatus: "uninsured",
        documentsRequired: JSON.stringify(["Proof of income", "Residency verification"]),
        applicationUrl: "https://www.bmc.org/financial-assistance",
        description: "Free care for uninsured patients meeting income requirements."
      }
    }),

    // Government programs
    prisma.aidProgram.create({
      data: {
        name: "Massachusetts Health Safety Net",
        type: "government",
        incomePctFPL: 200,
        residencyRequired: "Massachusetts",
        insuranceStatus: "uninsured",
        documentsRequired: JSON.stringify(["Income verification", "Residency proof", "Insurance denial letter"]),
        applicationUrl: "https://www.mass.gov/health-safety-net",
        description: "State program providing coverage for essential health services."
      }
    }),

    prisma.aidProgram.create({
      data: {
        name: "Emergency Medicaid",
        type: "government",
        incomePctFPL: 138,
        insuranceStatus: "uninsured",
        documentsRequired: JSON.stringify(["Emergency medical condition documentation", "Income proof"]),
        description: "Emergency coverage for qualifying medical conditions."
      }
    }),

    // Nonprofit programs
    prisma.aidProgram.create({
      data: {
        name: "HealthWell Foundation",
        type: "nonprofit",
        incomePctFPL: 500,
        insuranceStatus: "underinsured",
        documentsRequired: JSON.stringify(["Insurance card", "Medical bills", "Income verification"]),
        applicationUrl: "https://www.healthwellfoundation.org",
        description: "Copay and premium assistance for insured patients."
      }
    }),

    prisma.aidProgram.create({
      data: {
        name: "Patient Access Network Foundation",
        type: "nonprofit",
        incomePctFPL: 500,
        insuranceStatus: "any",
        documentsRequired: JSON.stringify(["Insurance information", "Treatment plan"]),
        applicationUrl: "https://www.panfoundation.org",
        description: "Financial assistance for out-of-pocket medical costs."
      }
    })
  ])

  // Create common medications for knee arthroscopy
  const medications = await Promise.all([
    prisma.medication.create({
      data: {
        ndc: "00093-0058-01",
        name: "Hydrocodone/Acetaminophen 5mg/325mg",
        generic: true,
        drugPrices: {
          create: [
            {
              pharmacyZip: "02118",
              cashPrice: 15.99,
              discountOptions: JSON.stringify(["GoodRx", "SingleCare"])
            },
            {
              pharmacyZip: "02114",
              cashPrice: 18.50,
              discountOptions: JSON.stringify(["GoodRx"])
            }
          ]
        }
      }
    }),

    prisma.medication.create({
      data: {
        ndc: "00781-1506-01",
        name: "Ibuprofen 600mg",
        generic: true,
        drugPrices: {
          create: [
            {
              pharmacyZip: "02118",
              cashPrice: 8.99,
              discountOptions: JSON.stringify(["GoodRx", "SingleCare", "Walmart $4"])
            }
          ]
        }
      }
    })
  ])

  // Create demo users
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@example.com",
      name: "Demo User",
      zip: "02118",
      role: "user"
    }
  })

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      role: "admin"
    }
  })

  console.log('Seed data created successfully!')
  console.log(`Created ${facilities.length} facilities`)
  console.log(`Created ${insurancePlans.length} insurance plans`)
  console.log(`Created ${aidPrograms.length} aid programs`)
  console.log(`Created ${medications.length} medications`)
  console.log('Demo users created with emails: demo@example.com, admin@example.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
