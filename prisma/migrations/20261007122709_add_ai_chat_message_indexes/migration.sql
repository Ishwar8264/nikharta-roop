-- Add indexes for AI chat hot queries:
--   listUserChats:    WHERE "userId" = ? ORDER BY "createdAt" DESC
--   listChatMessages: WHERE "chatId" = ? ORDER BY "createdAt" ASC

-- CreateIndex
CREATE INDEX "AiChat_userId_createdAt_idx" ON "AiChat"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AiMessage_chatId_createdAt_idx" ON "AiMessage"("chatId", "createdAt");
