/**
 * Seed script — populates the database with demo advertisements.
 * Run with: node src/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDb, dbProxy: db } = require('./db');

const DEMO_USERS = [
  { username: 'RobloxPro', email: 'robloxpro@demo.com', bio: 'Experienced Roblox builder with 5+ years building detailed games.', skills: ['Roblox Studio', 'Building', 'Terrain'] },
  { username: 'BlenderArtist', email: 'blender@demo.com', bio: '3D artist specializing in character modeling and animation.', skills: ['Blender', '3D Modeling', 'Rigging', 'Animation'] },
  { username: 'LuaCoder', email: 'lua@demo.com', bio: 'Roblox scripter and Lua developer. Love making complex game systems.', skills: ['Lua', 'Roblox Studio', 'Game Design'] },
  { username: 'WebDevPro', email: 'webdev@demo.com', bio: 'Full-stack web developer with React and Node.js expertise.', skills: ['React', 'Node.js', 'JavaScript', 'Python'] },
  { username: 'CharacterArtist', email: 'character@demo.com', bio: 'Specialized in stylized character art for games.', skills: ['Blender', 'ZBrush', 'Substance Painter', 'Character Design'] },
];

const DEMO_ADS = [
  {
    title: 'Looking for a Roblox Builder for Detailed Horror Game Map',
    category: 'roblox', job_type: 'Builder',
    description: 'I need an experienced Roblox builder to create a detailed abandoned hospital environment for my horror game. The map needs approximately 10 rooms with unique layouts, an exterior with overgrown vegetation, and atmospheric lighting. Reference images available. Long-term work opportunity if quality is good.',
    payment_type: 'Fixed Price', payment_amount: 5000, payment_currency: 'Robux',
    tags: ['horror', 'building', 'hospital', 'map'],
    required_skills: ['Roblox Studio', 'Building', 'Lighting'],
    contact_links: [{ platform: 'discord', url: 'HorrorGameDev#1234' }],
    userIdx: 0,
  },
  {
    title: 'Need Roblox Scripter for RPG Combat System',
    category: 'roblox', job_type: 'Scripter',
    description: 'Looking for a skilled Lua scripter to build a complete RPG combat system including:\n- Custom attack animations with hitbox detection\n- Skill/ability system with cooldowns\n- Status effects (poison, stun, burn)\n- Server-side validation for anti-exploit\n- Mobile-friendly controls\n\nMust have portfolio of previous Roblox scripts.',
    payment_type: 'Per Project', payment_amount: 150, payment_currency: 'USD',
    tags: ['rpg', 'combat', 'lua', 'scripting'],
    required_skills: ['Lua', 'Roblox Studio', 'OOP'],
    contact_links: [{ platform: 'discord', url: 'RPGDevStudio#5678' }],
    userIdx: 2,
  },
  {
    title: 'Blender Character Modeler Needed for Mobile Game',
    category: 'blender', job_type: 'Character Artist',
    description: 'We need a 3D character artist to model 6 hero characters for our upcoming mobile RPG. Style is stylized/cartoon. Each character needs:\n- Full mesh model (around 5k polys)\n- UV unwrapping\n- PBR texture set (albedo, normal, roughness)\n- Basic rigging for animation\n\nMust match our existing art style — reference sheet provided.',
    payment_type: 'Per Project', payment_amount: 300, payment_currency: 'USD',
    tags: ['character', 'mobile', 'stylized', 'rpg'],
    required_skills: ['Blender', 'Texturing', 'Rigging', 'Character Design'],
    contact_links: [{ platform: 'email', url: 'games@mobiledev.io' }, { platform: 'portfolio', url: 'https://mobiledev.io' }],
    userIdx: 1,
  },
  {
    title: 'React Developer for Creator Portfolio Website',
    category: 'coding', job_type: 'Frontend Developer',
    description: 'Looking for a skilled React developer to build a personal portfolio website for a game developer/artist. Requirements:\n- Clean, modern dark theme\n- Project showcase with images and descriptions\n- Animated transitions (Framer Motion preferred)\n- Contact form\n- Fully responsive\n- Deploy to Vercel\n\nDesign mockups provided in Figma.',
    payment_type: 'Fixed Price', payment_amount: 200, payment_currency: 'USD',
    tags: ['react', 'portfolio', 'frontend', 'web'],
    required_skills: ['React', 'CSS', 'JavaScript', 'Responsive Design'],
    contact_links: [{ platform: 'discord', url: 'PixelArtist#9012' }, { platform: 'github', url: 'https://github.com/pixelartist' }],
    userIdx: 3,
  },
  {
    title: 'Roblox UI Designer for Inventory & Shop System',
    category: 'roblox', job_type: 'UI Designer',
    description: 'Need a talented Roblox UI designer to create a complete GUI system for our fantasy RPG including:\n- Inventory grid with drag and drop\n- Shop/merchant UI\n- Character stats panel\n- Quest tracker HUD\n- Minimap overlay\n- Settings menu\n\nMust have clean, polished style — not default Roblox elements.',
    payment_type: 'Negotiable', payment_amount: null, payment_currency: 'Robux',
    tags: ['ui', 'design', 'inventory', 'rpg', 'gui'],
    required_skills: ['Roblox Studio', 'UI Design', 'Tweening'],
    contact_links: [{ platform: 'twitter', url: 'https://twitter.com/robloxgame' }],
    userIdx: 0,
  },
  {
    title: '3D Environment Artist for Sci-Fi Game Assets',
    category: 'blender', job_type: 'Environment Artist',
    description: 'We are building a sci-fi top-down shooter and need a 3D environment artist to create a modular asset pack. The pack should include:\n- 20+ modular sci-fi floor/wall/ceiling tiles\n- Props: terminals, crates, doors, lights\n- Low-poly optimized for real-time use\n- Consistent dark/neon color scheme\n- Ready for Unity import (FBX + textures)\n\nBudget flexible for the right artist.',
    payment_type: 'Per Project', payment_amount: 500, payment_currency: 'USD',
    tags: ['sci-fi', 'environment', 'modular', 'unity', 'assets'],
    required_skills: ['Blender', '3D Modeling', 'Texturing', 'Unity'],
    contact_links: [{ platform: 'email', url: 'studio@scifigame.dev' }],
    userIdx: 4,
  },
  {
    title: 'Python Bot Developer for Discord Community Server',
    category: 'coding', job_type: 'Python Developer',
    description: 'Looking for a Python developer to build a custom Discord bot for our Roblox game community. Features needed:\n- Verification system linking Discord to Roblox accounts\n- Rank/role assignment based on in-game level\n- Leaderboard commands pulling from game database\n- Moderation commands (warn, kick, ban with logging)\n- Welcome messages with embed cards\n- Ticket system for support\n\nBot must be hosted on our VPS.',
    payment_type: 'Fixed Price', payment_amount: 120, payment_currency: 'USD',
    tags: ['python', 'discord', 'bot', 'automation'],
    required_skills: ['Python', 'Discord.py', 'REST APIs', 'databases'],
    contact_links: [{ platform: 'discord', url: 'CommunityManager#3456' }],
    userIdx: 3,
  },
  {
    title: 'Roblox Animator Needed for Action Game',
    category: 'roblox', job_type: 'Animator',
    description: 'Hiring a Roblox animator for our action-adventure game. Need the following animation sets:\n- 8-directional movement (walk, run, crouch)\n- Combat set: light attack, heavy attack, dodge roll, block\n- Jump, fall, land animations\n- 5 ability animations\n- Death and respawn animations\n\nSmooth, snappy anime-inspired style preferred. Will provide reference videos.',
    payment_type: 'Per Project', payment_amount: 80, payment_currency: 'USD',
    tags: ['animation', 'action', 'combat', 'roblox'],
    required_skills: ['Roblox Studio', 'Animation Editor', 'Timing'],
    contact_links: [{ platform: 'discord', url: 'ActionGameDev#7890' }],
    userIdx: 2,
  },
];

async function seed() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('demo1234', 10);
  const userIds = [];

  for (const u of DEMO_USERS) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
    if (existing) {
      console.log(`  User ${u.username} already exists, skipping`);
      userIds.push(existing.id);
      continue;
    }
    const id = uuidv4();
    db.prepare(
      'INSERT INTO users (id, username, email, password_hash, bio, skills) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, u.username, u.email, password, u.bio, JSON.stringify(u.skills));
    userIds.push(id);
    console.log(`  Created user: ${u.username}`);
  }

  let adCount = 0;
  for (const ad of DEMO_ADS) {
    const existing = db.prepare('SELECT id FROM advertisements WHERE title = ?').get(ad.title);
    if (existing) {
      console.log(`  Ad "${ad.title.substring(0, 40)}..." already exists, skipping`);
      continue;
    }
    db.prepare(`
      INSERT INTO advertisements (
        id, user_id, title, category, job_type, description,
        payment_amount, payment_currency, payment_type,
        reference_images, contact_links, required_skills, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      userIds[ad.userIdx],
      ad.title,
      ad.category,
      ad.job_type,
      ad.description,
      ad.payment_amount,
      ad.payment_currency,
      ad.payment_type,
      '[]',
      JSON.stringify(ad.contact_links),
      JSON.stringify(ad.required_skills),
      JSON.stringify(ad.tags)
    );
    adCount++;
    console.log(`  Created ad: ${ad.title.substring(0, 50)}...`);
  }

  console.log(`\nSeed complete: ${userIds.length} users, ${adCount} new advertisements`);
  console.log('Demo account password: demo1234');
  process.exit(0);
}

initDb().then(seed).catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
