import db from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample videos related to healthcare in Africa
const sampleVideos = [
  {
    title: "The Future of Healthcare in Africa",
    description: "Exploring innovative healthcare solutions and technologies transforming medical services across the African continent.",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail_url: null,
    is_active: true,
    display_order: 1
  },
  {
    title: "Telemedicine Revolution in Rural Africa",
    description: "How telemedicine is bridging the healthcare gap in remote African communities.",
    video_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    thumbnail_url: null,
    is_active: true,
    display_order: 2
  },
  {
    title: "African Healthcare Investment Opportunities",
    description: "Key investment trends and opportunities in the African healthcare sector.",
    video_url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    thumbnail_url: null,
    is_active: true,
    display_order: 3
  },
  {
    title: "Digital Health Innovation in Nigeria",
    description: "Case studies of successful digital health startups transforming healthcare delivery in Nigeria.",
    video_url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    thumbnail_url: null,
    is_active: true,
    display_order: 4
  },
  {
    title: "Pharmaceutical Manufacturing in Africa",
    description: "The growth of local pharmaceutical manufacturing and its impact on healthcare accessibility.",
    video_url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    thumbnail_url: null,
    is_active: true,
    display_order: 5
  },
  {
    title: "Mental Health Awareness in African Communities",
    description: "Breaking the stigma around mental health and improving access to mental health services.",
    video_url: "https://www.youtube.com/watch?v=OPf0YbXqDm0",
    thumbnail_url: null,
    is_active: true,
    display_order: 6
  },
  {
    title: "Healthcare Data Analytics in Africa",
    description: "How data analytics is improving healthcare outcomes and decision-making across Africa.",
    video_url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    thumbnail_url: null,
    is_active: true,
    display_order: 7
  },
  {
    title: "Women's Health Initiatives in East Africa",
    description: "Programs and initiatives improving maternal and women's health outcomes in East African countries.",
    video_url: "https://www.youtube.com/watch?v=2Vv-BfVoq4g",
    thumbnail_url: null,
    is_active: true,
    display_order: 8
  },
  {
    title: "Medical Device Innovation in South Africa",
    description: "Local innovation in medical devices addressing unique healthcare challenges in South Africa.",
    video_url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    thumbnail_url: null,
    is_active: true,
    display_order: 9
  },
  {
    title: "Healthcare Policy and Regulation in Africa",
    description: "Understanding healthcare policy frameworks and regulatory environments across African nations.",
    video_url: "https://www.youtube.com/watch?v=kffacxfA7G4",
    thumbnail_url: null,
    is_active: true,
    display_order: 10
  },
  {
    title: "Public-Private Partnerships in Healthcare",
    description: "Successful models of public-private partnerships improving healthcare infrastructure in Africa.",
    video_url: "https://www.youtube.com/watch?v=ZbZSe6N_BXs",
    thumbnail_url: null,
    is_active: true,
    display_order: 11
  },
  {
    title: "Mobile Health Applications in Kenya",
    description: "How mobile health apps are revolutionizing healthcare access and delivery in Kenya.",
    video_url: "https://www.youtube.com/watch?v=YQHsXMglC9A",
    thumbnail_url: null,
    is_active: true,
    display_order: 12
  },
  {
    title: "Healthcare Workforce Development",
    description: "Training and developing healthcare professionals to meet the growing demand in Africa.",
    video_url: "https://www.youtube.com/watch?v=FTQbiNvZqaY",
    thumbnail_url: null,
    is_active: true,
    display_order: 13
  },
  {
    title: "Preventive Healthcare Programs",
    description: "Community-based preventive healthcare initiatives reducing disease burden in African populations.",
    video_url: "https://www.youtube.com/watch?v=TcMBFSGVi1c",
    thumbnail_url: null,
    is_active: true,
    display_order: 14
  }
];

async function seedVideos() {
  try {
    console.log('Starting video seeding...');
    
    // Ensure videos table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS blog_videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_url VARCHAR(500) NOT NULL,
        thumbnail_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Videos table verified');
    
    // Check if videos already exist (allow re-seeding by checking for sample videos)
    const [existing] = await db.execute('SELECT COUNT(*) as count FROM blog_videos');
    console.log(`Found ${existing[0].count} existing videos.`);
    
    // Check if sample videos already exist
    const [sampleCheck] = await db.execute(
      'SELECT COUNT(*) as count FROM blog_videos WHERE title LIKE ?',
      ['%Healthcare%']
    );
    
    if (sampleCheck[0].count > 0) {
      console.log('Sample videos already exist. Skipping seed.');
      console.log('To re-seed, delete existing sample videos first through admin panel.');
      return;
    }
    
    // Insert sample videos
    let inserted = 0;
    for (const video of sampleVideos) {
      try {
        await db.execute(
          `INSERT INTO blog_videos (title, description, video_url, thumbnail_url, is_active, display_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            video.title,
            video.description,
            video.video_url,
            video.thumbnail_url,
            video.is_active,
            video.display_order
          ]
        );
        inserted++;
        console.log(`✓ Inserted: ${video.title}`);
      } catch (error) {
        console.error(`✗ Failed to insert "${video.title}":`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully seeded ${inserted} videos!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding videos:', error);
    process.exit(1);
  }
}

seedVideos();

