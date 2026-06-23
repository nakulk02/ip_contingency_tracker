/**
 * Audit Log Utility
 * 
 * Tracks all changes to AssignmentAgreement records with full history
 * Uses transactions to ensure consistency
 */

import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

export interface AuditLogInput {
  assignmentId: string;
  action: AuditAction;
  userId: string;
  userName: string;
  userEmail: string;
  changedFields: Record<string, any>;
  previousValues: Record<string, any>;
  newValues: Record<string, any>;
  reason?: string;
}

/**
 * Create an audit log entry
 * Should be called within a transaction context
 */
export async function createAuditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      assignmentId: input.assignmentId,
      action: input.action,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      changedFields: input.changedFields,
      previousValues: input.previousValues,
      newValues: input.newValues,
      reason: input.reason,
    },
  });
}

/**
 * Get audit history for an assignment
 */
export async function getAssignmentAuditHistory(assignmentId: string) {
  return prisma.auditLog.findMany({
    where: { assignmentId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get audit history for a specific user
 */
export async function getUserAuditHistory(userId: string) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      assignment: {
        include: {
          person: true,
          ipAsset: true,
        },
      },
    },
  });
}

/**
 * Get all audit logs by action type
 */
export async function getAuditLogsByAction(action: AuditAction) {
  return prisma.auditLog.findMany({
    where: { action },
    orderBy: { createdAt: "desc" },
    include: {
      assignment: {
        include: {
          person: true,
          ipAsset: true,
        },
      },
    },
  });
}

/**
 * Calculate what changed between two states
 * Returns an object with only the fields that changed
 */
export function calculateChangedFields(
  previousValues: Record<string, any>,
  newValues: Record<string, any>
): Record<string, any> {
  const changed: Record<string, any> = {};

  // Check all keys in new values
  for (const key in newValues) {
    const oldValue = previousValues[key];
    const newValue = newValues[key];

    // Convert dates to ISO strings for comparison
    const oldValueStr = oldValue instanceof Date ? oldValue.toISOString() : String(oldValue);
    const newValueStr = newValue instanceof Date ? newValue.toISOString() : String(newValue);

    if (oldValueStr !== newValueStr) {
      changed[key] = {
        from: oldValue,
        to: newValue,
      };
    }
  }

  return changed;
}

/**
 * Create audit log for assignment creation
 * Should be called within a transaction
 */
export async function logAssignmentCreated(
  assignmentId: string,
  userId: string,
  userName: string,
  userEmail: string,
  newValues: Record<string, any>,
  reason?: string
) {
  return createAuditLog({
    assignmentId,
    action: "CREATE",
    userId,
    userName,
    userEmail,
    changedFields: {}, // Creation has no "changed" fields
    previousValues: {}, // No previous state
    newValues,
    reason,
  });
}

/**
 * Create audit log for assignment update
 * Should be called within a transaction
 */
export async function logAssignmentUpdated(
  assignmentId: string,
  userId: string,
  userName: string,
  userEmail: string,
  previousValues: Record<string, any>,
  newValues: Record<string, any>,
  reason?: string
) {
  const changedFields = calculateChangedFields(previousValues, newValues);

  return createAuditLog({
    assignmentId,
    action: "UPDATE",
    userId,
    userName,
    userEmail,
    changedFields,
    previousValues,
    newValues,
    reason,
  });
}

/**
 * Create audit log for assignment status change
 * Should be called within a transaction
 */
export async function logAssignmentStatusChanged(
  assignmentId: string,
  userId: string,
  userName: string,
  userEmail: string,
  previousValues: Record<string, any>,
  newValues: Record<string, any>,
  reason?: string
) {
  const changedFields = {
    status: {
      from: previousValues.status,
      to: newValues.status,
    },
  };

  return createAuditLog({
    assignmentId,
    action: "STATUS_CHANGE",
    userId,
    userName,
    userEmail,
    changedFields,
    previousValues,
    newValues,
    reason,
  });
}

/**
 * Create audit log for assignment deletion
 * Should be called within a transaction
 */
export async function logAssignmentDeleted(
  assignmentId: string,
  userId: string,
  userName: string,
  userEmail: string,
  previousValues: Record<string, any>,
  reason?: string
) {
  return createAuditLog({
    assignmentId,
    action: "DELETE",
    userId,
    userName,
    userEmail,
    changedFields: {}, // Deletion doesn't have "changes", just removal
    previousValues,
    newValues: {}, // No new state after deletion
    reason,
  });
}
