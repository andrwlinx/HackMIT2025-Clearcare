import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

const CrowdfundCreateSchema = z.object({
  estimateId: z.string(),
  targetAmount: z.number().min(100).max(100000),
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(1000),
  patientName: z.string().min(2).max(50),
  shareWithFamily: z.boolean().default(true),
  shareWithFriends: z.boolean().default(true),
  sharePublicly: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CrowdfundCreateSchema.parse(body)

    // Verify the estimate belongs to the user
    const estimate = await prisma.estimate.findFirst({
      where: {
        id: validatedData.estimateId,
        userId: userId
      },
      include: {
        facility: true
      }
    })

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Check if crowdfund link already exists for this estimate
    const existingLink = await prisma.crowdfundLink.findFirst({
      where: {
        estimateId: validatedData.estimateId,
        isActive: true
      }
    })

    if (existingLink) {
      return NextResponse.json({ error: 'Crowdfunding campaign already exists for this estimate' }, { status: 400 })
    }

    // Generate unique slug
    const slug = nanoid(10)

    // Create crowdfund link
    const crowdfundLink = await prisma.crowdfundLink.create({
      data: {
        id: nanoid(),
        estimateId: validatedData.estimateId,
        userId: userId,
        slug: slug,
        title: validatedData.title,
        description: validatedData.description,
        targetAmount: validatedData.targetAmount,
        currentAmount: 0,
        patientName: validatedData.patientName,
        shareWithFamily: validatedData.shareWithFamily,
        shareWithFriends: validatedData.shareWithFriends,
        sharePublicly: validatedData.sharePublicly,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: nanoid(),
        userId: userId,
        action: 'crowdfund_created',
        resourceType: 'crowdfund_link',
        resourceId: crowdfundLink.id,
        details: {
          targetAmount: validatedData.targetAmount,
          title: validatedData.title,
          estimateId: validatedData.estimateId
        },
        timestamp: new Date()
      }
    })

    // Generate sharing URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const campaignUrl = `${baseUrl}/crowdfund/${slug}`
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(campaignUrl)}&text=${encodeURIComponent(`Help ${validatedData.patientName} with medical expenses`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(campaignUrl)}`,
      email: `mailto:?subject=${encodeURIComponent(`Help ${validatedData.patientName} with medical expenses`)}&body=${encodeURIComponent(`I'm raising funds for my upcoming knee arthroscopy procedure. Any support would be greatly appreciated: ${campaignUrl}`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Help ${validatedData.patientName} with medical expenses: ${campaignUrl}`)}`
    }

    return NextResponse.json({
      success: true,
      crowdfundLink: {
        ...crowdfundLink,
        campaignUrl,
        shareUrls
      },
      message: 'Crowdfunding campaign created successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating crowdfund campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create crowdfunding campaign' },
      { status: 500 }
    )
  }
}
