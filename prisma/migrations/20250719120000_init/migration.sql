warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('OWNER', 'PARENT', 'CHILD', 'GUEST');

-- CreateEnum
CREATE TYPE "ChildStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "YearbookStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "YearbookTemplate" AS ENUM ('EDITORIAL', 'TIMELINE', 'ALBUM');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('COVER', 'SUMMARY', 'MILESTONES', 'STORIES', 'VIDEOS', 'MUSIC', 'PARENT_NOTES', 'TIMELINE', 'FUTURE_LETTER', 'ATTACHMENTS');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MediaVariantType" AS ENUM ('ORIGINAL', 'WEB', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'HTML', 'JSON', 'ZIP');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL DEFAULT 'PARENT',
    "childId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL DEFAULT 'CHILD',
    "childId" TEXT,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "activateAtAge" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "invitedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Child" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nickname" TEXT,
    "birthDate" DATE NOT NULL,
    "profilePhotoId" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT '#C4A77D',
    "titleFont" TEXT NOT NULL DEFAULT 'serif',
    "description" TEXT,
    "status" "ChildStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Yearbook" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "yearNumber" INTEGER,
    "periodStart" DATE,
    "periodEnd" DATE,
    "ageLabel" TEXT,
    "template" "YearbookTemplate" NOT NULL DEFAULT 'EDITORIAL',
    "status" "YearbookStatus" NOT NULL DEFAULT 'DRAFT',
    "coverPhotoId" TEXT,
    "customCoverTitle" TEXT,
    "summaryContent" JSONB,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Yearbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" DATE,
    "ageLabel" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEntry" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" DATE NOT NULL,
    "month" INTEGER,
    "ageLabel" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MusicEntry" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "spotifyUrl" TEXT,
    "youtubeUrl" TEXT,
    "coverUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentNote" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "noteDate" DATE NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FutureLetter" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "signature" TEXT,
    "letterDate" DATE NOT NULL,
    "hiddenUntilAge" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FutureLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "storyId" TEXT,
    "mediaId" TEXT NOT NULL,
    "title" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "yearbookId" TEXT,
    "type" "MediaType" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "duration" DOUBLE PRECISION,
    "storageKey" TEXT NOT NULL,
    "checksum" TEXT,
    "title" TEXT,
    "description" TEXT,
    "altText" TEXT,
    "capturedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "externalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaVariant" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "variant" "MediaVariantType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneMedia" (
    "milestoneId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MilestoneMedia_pkey" PRIMARY KEY ("milestoneId","mediaId")
);

-- CreateTable
CREATE TABLE "MilestoneTag" (
    "milestoneId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "MilestoneTag_pkey" PRIMARY KEY ("milestoneId","tagId")
);

-- CreateTable
CREATE TABLE "MilestonePerson" (
    "milestoneId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "MilestonePerson_pkey" PRIMARY KEY ("milestoneId","personId")
);

-- CreateTable
CREATE TABLE "TimelineEntryMedia" (
    "timelineEntryId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TimelineEntryMedia_pkey" PRIMARY KEY ("timelineEntryId","mediaId")
);

-- CreateTable
CREATE TABLE "TimelineEntryTag" (
    "timelineEntryId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TimelineEntryTag_pkey" PRIMARY KEY ("timelineEntryId","tagId")
);

-- CreateTable
CREATE TABLE "ExportJob" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "yearbookId" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "resultKey" TEXT,
    "resultSize" BIGINT,
    "error" TEXT,
    "options" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupJob" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "resultKey" TEXT,
    "resultSize" BIGINT,
    "destination" TEXT,
    "manifestKey" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "familyId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");

-- CreateIndex
CREATE INDEX "FamilyMember_userId_idx" ON "FamilyMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMember_familyId_userId_childId_key" ON "FamilyMember"("familyId", "userId", "childId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE INDEX "Invitation_familyId_idx" ON "Invitation"("familyId");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Child_familyId_status_idx" ON "Child"("familyId", "status");

-- CreateIndex
CREATE INDEX "Yearbook_childId_status_idx" ON "Yearbook"("childId", "status");

-- CreateIndex
CREATE INDEX "Section_yearbookId_order_idx" ON "Section"("yearbookId", "order");

-- CreateIndex
CREATE INDEX "Story_yearbookId_order_idx" ON "Story"("yearbookId", "order");

-- CreateIndex
CREATE INDEX "Milestone_yearbookId_order_idx" ON "Milestone"("yearbookId", "order");

-- CreateIndex
CREATE INDEX "TimelineEntry_yearbookId_month_idx" ON "TimelineEntry"("yearbookId", "month");

-- CreateIndex
CREATE INDEX "TimelineEntry_yearbookId_eventDate_idx" ON "TimelineEntry"("yearbookId", "eventDate");

-- CreateIndex
CREATE INDEX "MusicEntry_yearbookId_order_idx" ON "MusicEntry"("yearbookId", "order");

-- CreateIndex
CREATE INDEX "ParentNote_yearbookId_order_idx" ON "ParentNote"("yearbookId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "FutureLetter_yearbookId_key" ON "FutureLetter"("yearbookId");

-- CreateIndex
CREATE INDEX "Attachment_yearbookId_idx" ON "Attachment"("yearbookId");

-- CreateIndex
CREATE INDEX "MediaAsset_childId_type_idx" ON "MediaAsset"("childId", "type");

-- CreateIndex
CREATE INDEX "MediaAsset_yearbookId_idx" ON "MediaAsset"("yearbookId");

-- CreateIndex
CREATE INDEX "MediaAsset_processingStatus_idx" ON "MediaAsset"("processingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "MediaVariant_mediaId_variant_key" ON "MediaVariant"("mediaId", "variant");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_familyId_name_key" ON "Tag"("familyId", "name");

-- CreateIndex
CREATE INDEX "Location_familyId_idx" ON "Location"("familyId");

-- CreateIndex
CREATE INDEX "Person_familyId_idx" ON "Person"("familyId");

-- CreateIndex
CREATE INDEX "ExportJob_familyId_idx" ON "ExportJob"("familyId");

-- CreateIndex
CREATE INDEX "ExportJob_yearbookId_status_idx" ON "ExportJob"("yearbookId", "status");

-- CreateIndex
CREATE INDEX "BackupJob_familyId_status_idx" ON "BackupJob"("familyId", "status");

-- CreateIndex
CREATE INDEX "AuditLog_familyId_createdAt_idx" ON "AuditLog"("familyId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_profilePhotoId_fkey" FOREIGN KEY ("profilePhotoId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Child" ADD CONSTRAINT "Child_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yearbook" ADD CONSTRAINT "Yearbook_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yearbook" ADD CONSTRAINT "Yearbook_coverPhotoId_fkey" FOREIGN KEY ("coverPhotoId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yearbook" ADD CONSTRAINT "Yearbook_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Yearbook" ADD CONSTRAINT "Yearbook_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntry" ADD CONSTRAINT "TimelineEntry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MusicEntry" ADD CONSTRAINT "MusicEntry_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentNote" ADD CONSTRAINT "ParentNote_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FutureLetter" ADD CONSTRAINT "FutureLetter_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaVariant" ADD CONSTRAINT "MediaVariant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneMedia" ADD CONSTRAINT "MilestoneMedia_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneMedia" ADD CONSTRAINT "MilestoneMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneTag" ADD CONSTRAINT "MilestoneTag_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneTag" ADD CONSTRAINT "MilestoneTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestonePerson" ADD CONSTRAINT "MilestonePerson_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestonePerson" ADD CONSTRAINT "MilestonePerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntryMedia" ADD CONSTRAINT "TimelineEntryMedia_timelineEntryId_fkey" FOREIGN KEY ("timelineEntryId") REFERENCES "TimelineEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntryMedia" ADD CONSTRAINT "TimelineEntryMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntryTag" ADD CONSTRAINT "TimelineEntryTag_timelineEntryId_fkey" FOREIGN KEY ("timelineEntryId") REFERENCES "TimelineEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEntryTag" ADD CONSTRAINT "TimelineEntryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_yearbookId_fkey" FOREIGN KEY ("yearbookId") REFERENCES "Yearbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupJob" ADD CONSTRAINT "BackupJob_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

