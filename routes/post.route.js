import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { create, deletepost, getposts, updatepost } from '../controllers/post.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createPostSchema, updatePostSchema } from '../validations/post.validation.js';

const router = express.Router();

router.post('/create', verifyToken, validate(createPostSchema), create)
router.get('/getposts', getposts)
router.delete('/deletepost/:postId/:userId', verifyToken, deletepost)
router.put('/updatepost/:postId/:userId', verifyToken, validate(updatePostSchema), updatepost)

router.get('/seed-data', async (req, res) => {
  const posts = [
    { title: 'Shimla: The Winter Queen (North India)', content: 'Shimla is the capital of Himachal Pradesh and the most famous hill station in North India.', image: 'https://images.unsplash.com/photo-1621252327771-6c2e39c4d9a2?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'shimla-north-india', userId: '65f123456789012345678901' },
    { title: 'Leh Ladakh: High Altitudes (North India)', content: 'Experience the magic of the Himalayas in North India.', image: 'https://images.unsplash.com/photo-1581791538302-03537b9c97bf?auto=format&fit=crop&q=80&w=1200', category: 'adventure', slug: 'leh-ladakh-north-india', userId: '65f123456789012345678901' },
    { title: 'Varanasi: The Spiritual Soul (North India)', content: 'The oldest living city in North India.', image: 'https://images.unsplash.com/photo-1561240681-d7773b32d6ec?auto=format&fit=crop&q=80&w=1200', category: 'spiritual', slug: 'varanasi-north-india', userId: '65f123456789012345678901' },
    { title: 'Rishikesh: Yoga & Ganges (North India)', content: 'The yoga capital located in North India.', image: 'https://images.unsplash.com/photo-1598977123118-4e30ba3c4f5b?auto=format&fit=crop&q=80&w=1200', category: 'spiritual', slug: 'rishikesh-north-india', userId: '65f123456789012345678901' },
    { title: 'Srinagar: Paradise on Earth (North India)', content: 'Dal Lake and gardens in North India.', image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'srinagar-north-india', userId: '65f123456789012345678901' },
    { title: 'Manali: Valley of Gods (North India)', content: 'A premier adventure destination in North India.', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=1200', category: 'adventure', slug: 'manali-north-india', userId: '65f123456789012345678901' },
    { title: 'Munnar: Tea Gardens (South India)', content: 'Breathtaking tea estates in South India.', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'munnar-south-india', userId: '65f123456789012345678901' },
    { title: 'Alleppey: Backwater Bliss (South India)', content: 'Houseboats and lagoons in South India.', image: 'https://images.unsplash.com/photo-1582538186441-ad0cf8266774?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'alleppey-south-india', userId: '65f123456789012345678901' },
    { title: 'Hampi: Stone Chariots (South India)', content: 'Ancient ruins of an empire in South India.', image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=1200', category: 'historical', slug: 'hampi-south-india', userId: '65f123456789012345678901' },
    { title: 'Pondicherry: French Quarters (South India)', content: 'European vibes in South India.', image: 'https://images.unsplash.com/photo-1589793413303-34e2f5926ec3?auto=format&fit=crop&q=80&w=1200', category: 'historical', slug: 'pondicherry-south-india', userId: '65f123456789012345678901' },
    { title: 'Ooty: Blue Mountains (South India)', content: 'A classic hill station in South India.', image: 'https://images.unsplash.com/photo-1592305531773-455b9e078f14?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'ooty-south-india', userId: '65f123456789012345678901' },
    { title: 'Madurai: Temple City (South India)', content: 'Ancient cultural heart of South India.', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=1200', category: 'spiritual', slug: 'madurai-south-india', userId: '65f123456789012345678901' },
    { title: 'Jaipur: Royal Pink (West India)', content: 'History and royalty in West India.', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80&w=1200', category: 'historical', slug: 'jaipur-west-india', userId: '65f123456789012345678901' },
    { title: 'Udaipur: City of Lakes (West India)', content: 'Romantic lakes in West India.', image: 'https://images.unsplash.com/photo-1590503154784-5165c7112eb1?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'udaipur-west-india', userId: '65f123456789012345678901' },
    { title: 'Goa: Beach Capital (West India)', content: 'Sand and party in West India.', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'goa-west-india', userId: '65f123456789012345678901' },
    { title: 'Jaisalmer: Golden Sands (West India)', content: 'Deserts and forts in West India.', image: 'https://images.unsplash.com/photo-1545051905-391d5236443c?auto=format&fit=crop&q=80&w=1200', category: 'adventure', slug: 'jaisalmer-west-india', userId: '65f123456789012345678901' },
    { title: 'Rann of Kutch: White Salt (West India)', content: 'Unreal landscape in West India.', image: 'https://images.unsplash.com/photo-1616843413587-9e3a37f7bbd8?auto=format&fit=crop&q=80&w=1200', category: 'adventure', slug: 'kutch-west-india', userId: '65f123456789012345678901' },
    { title: 'Lonavala: Rainy Retreat (West India)', content: 'Monsoon magic in West India.', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'lonavala-west-india', userId: '65f123456789012345678901' },
    { title: 'Darjeeling: Tea Queen (East India)', content: 'Snowy peaks and tea in East India.', image: 'https://images.unsplash.com/photo-1616843413587-9e3a37f7bbd8?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'darjeeling-east-india', userId: '65f123456789012345678901' },
    { title: 'Gangtok: Sikkimese Jewel (East India)', content: 'Monasteries and mountains in East India.', image: 'https://images.unsplash.com/photo-1621252327771-6c2e39c4d9a2?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'gangtok-east-india', userId: '65f123456789012345678901' },
    { title: 'Puri: Holy Coast (East India)', content: 'Jagannath temple and beach in East India.', image: 'https://images.unsplash.com/photo-1598977123118-4e30ba3c4f5b?auto=format&fit=crop&q=80&w=1200', category: 'spiritual', slug: 'puri-east-india', userId: '65f123456789012345678901' },
    { title: 'Shillong: Scotland of East (East India)', content: 'Rolling hills and waterfalls in East India.', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'shillong-east-india', userId: '65f123456789012345678901' },
    { title: 'Majuli: River Island (East India)', content: 'The largest river island in East India.', image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&q=80&w=1200', category: 'nature', slug: 'majuli-east-india', userId: '65f123456789012345678901' },
    { title: 'Tawang: Monastic Clouds (East India)', content: 'Ancient culture in the hills of East India.', image: 'https://images.unsplash.com/photo-1581791538302-03537b9c97bf?auto=format&fit=crop&q=80&w=1200', category: 'adventure', slug: 'tawang-east-india', userId: '65f123456789012345678901' }
  ];

  try {
    const Post = (await import('../models/post.model.js')).default;
    await Post.deleteMany({});
    await Post.insertMany(posts);
    res.status(200).json({ message: '✨ SUCCESS: 24 iconic destinations added for North, South, West, and East India!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;