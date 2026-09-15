import bcrypt from 'bcryptjs';
import { connectDb } from '../config/db';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { Book } from '../models/Book';

const SECTIONS = ['books', 'users', 'roles', 'permissions', 'orders', 'reviews', 'reports'] as const;

const CRUD = ['create', 'read', 'update', 'delete'] as const;

function basePermissions() {
  const perms: { slug: string; name: string; description: string; section: string }[] = [];

  for (const section of SECTIONS) {
    for (const action of CRUD) {
      perms.push({
        slug: `${section}:${action}`,
        name: `${section} ${action}`,
        description: `Can ${action} ${section}`,
        section,
      });
    }
  }

  const extras = [
    { slug: 'orders:read-own', name: 'orders read own', description: 'Read own orders', section: 'orders' },
    { slug: 'orders:update-status', name: 'orders update status', description: 'Update order status', section: 'orders' },
    { slug: 'reviews:update-own', name: 'reviews update own', description: 'Update own reviews', section: 'reviews' },
    { slug: 'reviews:delete-own', name: 'reviews delete own', description: 'Delete own reviews', section: 'reviews' },
    { slug: 'users:read-own', name: 'users read own', description: 'Read own profile', section: 'users' },
    { slug: 'users:update-own', name: 'users update own', description: 'Update own profile', section: 'users' },
    { slug: 'reports:analytics', name: 'reports analytics', description: 'View analytics', section: 'reports' },
    { slug: 'reports:manage', name: 'reports manage', description: 'Manage issue reports', section: 'reports' },
    { slug: 'reports:issues:create', name: 'reports issues create', description: 'Create issue reports', section: 'reports' },
  ];

  return [...perms, ...extras];
}

const CUSTOMER_SLUGS = [
  'books:read',
  'orders:create',
  'orders:read-own',
  'reviews:create',
  'reviews:read',
  'reviews:update-own',
  'reviews:delete-own',
  'reports:issues:create',
  'users:read-own',
  'users:update-own',
];

async function seed() {
  await connectDb();
  console.log('Seeding...');

  const defs = basePermissions();
  for (const def of defs) {
    await Permission.findOneAndUpdate({ slug: def.slug }, def, { upsert: true, new: true });
  }
  const allPerms = await Permission.find();
  console.log(`Permissions: ${allPerms.length}`);

  const adminRole = await Role.findOneAndUpdate(
    { name: 'admin' },
    {
      name: 'admin',
      description: 'Full access',
      permissions: allPerms.map((p) => p._id),
    },
    { upsert: true, new: true },
  );

  const customerPermIds = allPerms.filter((p) => CUSTOMER_SLUGS.includes(p.slug)).map((p) => p._id);
  const customerRole = await Role.findOneAndUpdate(
    { name: 'customer' },
    {
      name: 'customer',
      description: 'Default customer role',
      permissions: customerPermIds,
    },
    { upsert: true, new: true },
  );

  console.log(`Roles: admin=${adminRole.id}, customer=${customerRole.id}`);

  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const admin = await User.findOneAndUpdate(
    { email: 'admin@bookstore.local' },
    {
      name: 'Admin',
      email: 'admin@bookstore.local',
      passwordHash,
      roles: [adminRole._id],
      isActive: true,
      deletedAt: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  // Ensure password is set even if user existed without select
  admin.passwordHash = passwordHash;
  admin.roles = [adminRole._id];
  admin.isActive = true;
  await admin.save();
  console.log(`Admin user: ${admin.email} / Admin123!`);

  const sampleBooks = [
    {
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt',
      description: 'Classic software craftsmanship.',
      isbn: '978-0201616224',
      price: 42.99,
      stock: 25,
      categories: ['programming', 'software'],
    },
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      description: 'A handbook of agile software craftsmanship.',
      isbn: '978-0132350884',
      price: 37.5,
      stock: 40,
      categories: ['programming'],
    },
    {
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      description: 'The big ideas behind reliable, scalable systems.',
      isbn: '978-1449373320',
      price: 49.99,
      stock: 15,
      categories: ['data', 'architecture'],
    },
  ];

  for (const b of sampleBooks) {
    await Book.findOneAndUpdate({ isbn: b.isbn }, b, { upsert: true, new: true });
  }
  console.log(`Sample books upserted: ${sampleBooks.length}`);

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
