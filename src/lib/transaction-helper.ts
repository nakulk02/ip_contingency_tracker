/**
 * Transaction Helper for Assignment Operations
 * 
 * Ensures that assignment changes and audit logs are created atomically
 * within a database transaction
 */

import { prisma } from "@/lib/prisma";
import {
  logAssignmentCreated,
  logAssignmentUpdated,
  logAssignmentStatusChanged,
  logAssignmentDeleted,
} from "@/lib/audit-log";
import { AssignmentAgreement } from "@prisma/client";

export interface CreateAssignmentInput {
  personId: string;
  ipAssetId?: string | null;
  scope: "COMPANY_WIDE" | "ASSET_SPECIFIC";
  signedDate?: Date | null;
  fileReference?: string | null;
  status: "SIGNED" | "MISSING" | "PENDING";
  notes?: string | null;
}

export interface UpdateAssignmentInput {
  id: string;
  ipAssetId?: string | null;
  scope?: "COMPANY_WIDE" | "ASSET_SPECIFIC";
  signedDate?: Date | null;
  fileReference?: string | null;
  status?: "SIGNED" | "MISSING" | "PENDING";
  notes?: string | null;
}

export interface AuditContext {
  userId: string;
  userName: string;
  userEmail: string;
  reason?: string;
}

/**
 * Create an assignment with audit logging in a transaction
 */
export async function createAssignmentWithAudit(
  input: CreateAssignmentInput,
  auditContext: AuditContext
): Promise<AssignmentAgreement> {
  return prisma.$transaction(async (tx) => {
    // Create the assignment
    const assignment = await tx.assignmentAgreement.create({
      data: input,
    });

    // Log the creation
    await logAssignmentCreated(
      assignment.id,
      auditContext.userId,
      auditContext.userName,
      auditContext.userEmail,
      {
        id: assignment.id,
        personId: assignment.personId,
        ipAssetId: assignment.ipAssetId,
        scope: assignment.scope,
        signedDate: assignment.signedDate,
        fileReference: assignment.fileReference,
        status: assignment.status,
        notes: assignment.notes,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      },
      auditContext.reason
    );

    return assignment;
  });
}

/**
 * Update an assignment with audit logging in a transaction
 */
export async function updateAssignmentWithAudit(
  input: UpdateAssignmentInput,
  auditContext: AuditContext
): Promise<AssignmentAgreement> {
  return prisma.$transaction(async (tx) => {
    // Fetch the current state
    const previousAssignment = await tx.assignmentAgreement.findUniqueOrThrow({
      where: { id: input.id },
    });

    // Update the assignment
    const updatedAssignment = await tx.assignmentAgreement.update({
      where: { id: input.id },
      data: {
        ...(input.ipAssetId !== undefined && { ipAssetId: input.ipAssetId }),
        ...(input.scope !== undefined && { scope: input.scope }),
        ...(input.signedDate !== undefined && { signedDate: input.signedDate }),
        ...(input.fileReference !== undefined && { fileReference: input.fileReference }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });

    // Determine if this is a status change
    const isStatusChange = input.status !== undefined && input.status !== previousAssignment.status;

    // Log the update or status change
    if (isStatusChange) {
      await logAssignmentStatusChanged(
        updatedAssignment.id,
        auditContext.userId,
        auditContext.userName,
        auditContext.userEmail,
        {
          id: previousAssignment.id,
          personId: previousAssignment.personId,
          ipAssetId: previousAssignment.ipAssetId,
          scope: previousAssignment.scope,
          signedDate: previousAssignment.signedDate,
          fileReference: previousAssignment.fileReference,
          status: previousAssignment.status,
          notes: previousAssignment.notes,
          createdAt: previousAssignment.createdAt,
          updatedAt: previousAssignment.updatedAt,
        },
        {
          id: updatedAssignment.id,
          personId: updatedAssignment.personId,
          ipAssetId: updatedAssignment.ipAssetId,
          scope: updatedAssignment.scope,
          signedDate: updatedAssignment.signedDate,
          fileReference: updatedAssignment.fileReference,
          status: updatedAssignment.status,
          notes: updatedAssignment.notes,
          createdAt: updatedAssignment.createdAt,
          updatedAt: updatedAssignment.updatedAt,
        },
        auditContext.reason
      );
    } else {
      await logAssignmentUpdated(
        updatedAssignment.id,
        auditContext.userId,
        auditContext.userName,
        auditContext.userEmail,
        {
          id: previousAssignment.id,
          personId: previousAssignment.personId,
          ipAssetId: previousAssignment.ipAssetId,
          scope: previousAssignment.scope,
          signedDate: previousAssignment.signedDate,
          fileReference: previousAssignment.fileReference,
          status: previousAssignment.status,
          notes: previousAssignment.notes,
          createdAt: previousAssignment.createdAt,
          updatedAt: previousAssignment.updatedAt,
        },
        {
          id: updatedAssignment.id,
          personId: updatedAssignment.personId,
          ipAssetId: updatedAssignment.ipAssetId,
          scope: updatedAssignment.scope,
          signedDate: updatedAssignment.signedDate,
          fileReference: updatedAssignment.fileReference,
          status: updatedAssignment.status,
          notes: updatedAssignment.notes,
          createdAt: updatedAssignment.createdAt,
          updatedAt: updatedAssignment.updatedAt,
        },
        auditContext.reason
      );
    }

    return updatedAssignment;
  });
}

/**
 * Delete an assignment with audit logging in a transaction
 */
export async function deleteAssignmentWithAudit(
  assignmentId: string,
  auditContext: AuditContext
): Promise<AssignmentAgreement> {
  return prisma.$transaction(async (tx) => {
    // Fetch the current state before deletion
    const assignmentToDelete = await tx.assignmentAgreement.findUniqueOrThrow({
      where: { id: assignmentId },
    });

    // Delete the assignment
    const deletedAssignment = await tx.assignmentAgreement.delete({
      where: { id: assignmentId },
    });

    // Log the deletion
    await logAssignmentDeleted(
      assignmentId,
      auditContext.userId,
      auditContext.userName,
      auditContext.userEmail,
      {
        id: assignmentToDelete.id,
        personId: assignmentToDelete.personId,
        ipAssetId: assignmentToDelete.ipAssetId,
        scope: assignmentToDelete.scope,
        signedDate: assignmentToDelete.signedDate,
        fileReference: assignmentToDelete.fileReference,
        status: assignmentToDelete.status,
        notes: assignmentToDelete.notes,
        createdAt: assignmentToDelete.createdAt,
        updatedAt: assignmentToDelete.updatedAt,
      },
      auditContext.reason
    );

    return deletedAssignment;
  });
}
