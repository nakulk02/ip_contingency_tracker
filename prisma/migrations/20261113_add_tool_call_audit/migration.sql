-- CreateTable
CREATE TABLE "ToolCallAudit" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "inputSummary" JSONB NOT NULL,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "durationMs" INTEGER NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolCallAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToolCallAudit_requestId_idx" ON "ToolCallAudit"("requestId");

-- CreateIndex
CREATE INDEX "ToolCallAudit_userId_idx" ON "ToolCallAudit"("userId");

-- CreateIndex
CREATE INDEX "ToolCallAudit_tool_idx" ON "ToolCallAudit"("tool");

-- CreateIndex
CREATE INDEX "ToolCallAudit_createdAt_idx" ON "ToolCallAudit"("createdAt");
