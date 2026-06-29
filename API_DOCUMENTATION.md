/**
 * API DOCUMENTATION
 * 
 * DEPRECATED ENDPOINTS (to be removed in v2):
 * - GET/POST /api/people (use /api/v1/people)
 * - GET/PUT/DELETE /api/people/[id] (use /api/v1/people/[id])
 * - GET/POST /api/ip-assets (use /api/v1/ip-assets)
 * - GET/PUT/DELETE /api/ip-assets/[id] (use /api/v1/ip-assets/[id])
 * - GET/POST/PUT/DELETE /api/assignments (use /api/v1/assignments)
 * - GET /api/dashboard/ownership-gaps (use /api/v1/dashboard/ownership-gaps)
 * - GET/POST /api/notes (use /api/v1/notes)
 * - GET/PUT/DELETE /api/notes/[id] (use /api/v1/notes/[id])
 * 
 * CURRENT API (v1):
 * 
 * ============ PEOPLE ============
 * GET    /api/v1/people?page=1&limit=20&role=EMPLOYEE&status=current&gapsOnly=true&startDateFrom=DATE&startDateTo=DATE
 * POST   /api/v1/people
 * GET    /api/v1/people/[id]
 * PUT    /api/v1/people/[id]
 * DELETE /api/v1/people/[id]
 * POST   /api/v1/people/bulk-import
 * 
 * ============ IP ASSETS ============
 * GET    /api/v1/ip-assets?page=1&limit=20&type=PATENT&status=FILED&jurisdiction=US&gapsOnly=true&filingDateFrom=DATE
 * POST   /api/v1/ip-assets
 * GET    /api/v1/ip-assets/[id]
 * PUT    /api/v1/ip-assets/[id]
 * DELETE /api/v1/ip-assets/[id]
 * POST   /api/v1/ip-assets/bulk-import
 * 
 * ============ ASSIGNMENTS ============
 * GET    /api/v1/assignments?page=1&limit=20&status=PENDING&personId=ID
 * POST   /api/v1/assignments (with optional skipComplianceCheck)
 * GET    /api/v1/assignments/[id]
 * PUT    /api/v1/assignments/[id]
 * DELETE /api/v1/assignments/[id]
 * GET    /api/v1/assignments/[id]/audit-history
 * 
 * ============ AUDIT LOGS ============
 * GET    /api/v1/audit-logs?action=STATUS_CHANGE&page=1&limit=20
 * GET    /api/v1/audit-logs/user?page=1&limit=20
 * 
 * ============ DASHBOARD ============
 * GET    /api/v1/dashboard/ownership-gaps?limit=5
 * 
 * ============ NOTIFICATIONS ============
 * GET    /api/v1/notifications/overdue?thresholdDays=30
 * 
 * ============ REPORTING ============
 * GET    /api/v1/reports/gap-report?format=csv|json
 * GET    /api/v1/reports/compliance-audit
 * GET    /api/v1/reports/executive-summary
 * 
 * ============ NOTES ============
 * GET    /api/v1/notes?page=1&limit=20&type=ASSIGNMENT|PERSON|ASSET
 * POST   /api/v1/notes
 * GET    /api/v1/notes/[id]
 * PUT    /api/v1/notes/[id]
 * DELETE /api/v1/notes/[id]
 * 
 * ============ AUTH ============
 * POST   /api/auth/register
 * GET    /api/auth/session
 * (NextAuth)
 */
