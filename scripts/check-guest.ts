import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const user = await db.user.findUnique({
    where: { email: 'guest@apex-demo.com' },
    include: {
      workspaceMembers: {
        include: { workspace: true },
      },
    },
  });

  if (!user) {
    console.log('❌ Guest user NOT found in database');
    console.log('Run: npx prisma db seed');
    return;
  }

  console.log('✅ Guest user found:');
  console.log('  id:', user.id);
  console.log('  clerkId:', user.clerkId);
  console.log('  email:', user.email);
  console.log('  workspaceMembers:', user.workspaceMembers.length);
  user.workspaceMembers.forEach(m => {
    console.log(`    - workspace: ${m.workspace.name} (slug: ${m.workspace.slug}), role: ${m.role}`);
  });

  const expectedClerkId = process.env.GUEST_CLERK_ID;
  if (expectedClerkId && user.clerkId !== expectedClerkId) {
    console.log('\n⚠️  clerkId MISMATCH:');
    console.log('  DB has:    ', user.clerkId);
    console.log('  .env has:  ', expectedClerkId);
    console.log('\nFixing...');
    await db.user.update({
      where: { email: 'guest@apex-demo.com' },
      data: { clerkId: expectedClerkId },
    });
    console.log('✅ clerkId updated to:', expectedClerkId);
  } else {
    console.log('\n✅ clerkId matches .env GUEST_CLERK_ID');
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
