-- CreateTable
CREATE TABLE "_MemberServiceRequests" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MemberServiceRequests_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MemberServiceRequests_B_index" ON "_MemberServiceRequests"("B");

-- AddForeignKey
ALTER TABLE "_MemberServiceRequests" ADD CONSTRAINT "_MemberServiceRequests_A_fkey" FOREIGN KEY ("A") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MemberServiceRequests" ADD CONSTRAINT "_MemberServiceRequests_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
