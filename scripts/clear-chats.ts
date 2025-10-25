import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting chat cleanup...\n');

  // Get counts before deletion
  const messagesCount = await prisma.message.count();
  const chatsCount = await prisma.chat.count();
  const participantsCount = await prisma.chatParticipant.count();
  const attachmentsCount = await prisma.messageAttachment.count();
  const readReceiptsCount = await prisma.messageReadReceipt.count();

  console.log('Current state:');
  console.log(`  - Messages: ${messagesCount}`);
  console.log(`  - Chats: ${chatsCount}`);
  console.log(`  - Participants: ${participantsCount}`);
  console.log(`  - Attachments: ${attachmentsCount}`);
  console.log(`  - Read Receipts: ${readReceiptsCount}`);
  console.log('\n' + '='.repeat(60));

  // Delete in correct order (respecting foreign key constraints)
  
  // Delete read receipts first
  console.log('\nDeleting all read receipts...');
  const deletedReceipts = await prisma.messageReadReceipt.deleteMany({});
  console.log(`✓ Deleted ${deletedReceipts.count} read receipts`);

  // Delete message attachments
  console.log('\nDeleting all message attachments...');
  const deletedAttachments = await prisma.messageAttachment.deleteMany({});
  console.log(`✓ Deleted ${deletedAttachments.count} attachments`);

  // Delete all messages
  console.log('\nDeleting all messages...');
  const deletedMessages = await prisma.message.deleteMany({});
  console.log(`✓ Deleted ${deletedMessages.count} messages`);

  // Delete all chat participants
  console.log('\nDeleting all chat participants...');
  const deletedParticipants = await prisma.chatParticipant.deleteMany({});
  console.log(`✓ Deleted ${deletedParticipants.count} chat participants`);

  // Delete all chats (including groups)
  console.log('\nDeleting all chats and groups...');
  const deletedChats = await prisma.chat.deleteMany({});
  console.log(`✓ Deleted ${deletedChats.count} chats`);

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Chat cleanup complete!');
  console.log('All messages, chats, groups, and related data have been removed.\n');
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
