const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Plant = require('../models/Plant');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const ContactMessage = require('../models/ContactMessage');

const fs = require('fs');
const path = require('path');

// Load environment variables from backend/.env or root .env
if (fs.existsSync(path.join(__dirname, '..', '.env'))) {
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
} else if (fs.existsSync(path.join(__dirname, '..', '..', '.env'))) {
  dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
} else {
  dotenv.config();
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nurvana');
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const getImagePath = (categoryName, plantName) => {
  const categoryFolders = {
    'Indoor Plants': 'indoor',
    'Outdoor Plants': 'outdoor',
    'Flowering Plants': 'flowering',
    'Herbal & Medicinal Plants': 'herbal',
    'Succulents & Cacti': 'succulents',
    'Fruit Plants': 'fruit',
    'Vegetable Plants': 'vegetable',
    'Air Purifying Plants': 'air-purifying',
    'Bonsai Plants': 'bonsai',
    'Hanging & Creeper Plants': 'hanging'
  };

  const folder = categoryFolders[categoryName] || 'indoor';
  const nameHyphenated = plantName.replace(/\s+/g, '-');
  return `/assets/images/plants/${folder}/${nameHyphenated}.webp`;
};


const categoriesSeed = [
  { name: 'Indoor Plants', description: 'Perfect for low-light indoor environments like home offices, bedrooms, and living rooms.' },
  { name: 'Outdoor Plants', description: 'Hardy trees, shrubs, and ornamental plants that thrive in full sun.' },
  { name: 'Flowering Plants', description: 'Ornamental species that bloom repeatedly, adding color and fragrance to your garden.' },
  { name: 'Herbal & Medicinal Plants', description: 'Wellness herbs and medicinal plants with traditional health benefits.' },
  { name: 'Succulents & Cacti', description: 'Drought-resistant desert plants with fleshy leaves, requiring minimal watering.' },
  { name: 'Fruit Plants', description: 'Fruit-bearing saplings and grafted trees for home orchards and terraces.' },
  { name: 'Vegetable Plants', description: 'Easy-to-grow seasonal vegetables and greens for kitchen gardening.' },
  { name: 'Air Purifying Plants', description: 'NASA-approved houseplants that naturally filter toxins and improve indoor air quality.' },
  { name: 'Bonsai Plants', description: 'Specially trained miniature trees presenting artistic natural shapes.' },
  { name: 'Hanging & Creeper Plants', description: 'Vines and trailing creepers that cascade elegantly in hanging pots.' }
];

const plantsData = {
  'Indoor Plants': [
    { name: 'Money Plant', desc: 'A popular indoor foliage climber believed to bring wealth and prosperity.' },
    { name: 'Snake Plant', desc: 'An extremely hardy succulent with upright green leaves, excellent for filtering indoor air.' },
    { name: 'ZZ Plant', desc: 'Characterized by shiny, waxy leaves on thick stems. Highly tolerant to low light.' },
    { name: 'Areca Palm', desc: 'Feathery, arching fronds that add a tropical aesthetic and humidify the air.' },
    { name: 'Peace Lily', desc: 'Elegant dark green leaves with beautiful white spathes. Filters airborne pollutants.' },
    { name: 'Spider Plant', desc: 'Features graceful green-and-white striped leaves that produce hanging baby plants.' },
    { name: 'Rubber Plant', desc: 'Striking ornamental plant with thick, glossy, dark green leaves.' },
    { name: 'Chinese Evergreen', desc: 'Beautifully patterned, variegated green leaves that survive in dark spaces.' },
    { name: 'Philodendron', desc: 'Graceful climbing or trailing indoor vine with heart-shaped leaves.' },
    { name: 'Syngonium', desc: 'Also known as Arrowhead plant, featuring soft, pastel-colored foliage.' },
    { name: 'Dracaena', desc: 'Upright cornstalk-like leaves with colourful margins, perfect for room corners.' },
    { name: 'Aglaonema', desc: 'Highly decorative houseplant with silver-green patterns on large leaves.' },
    { name: 'Monstera Deliciosa', desc: 'Swiss cheese plant with iconic natural leaf splits. Adds instant tropical vibes.' },
    { name: 'Parlor Palm', desc: 'Compact, slow-growing palm species that thrives in indoor container environments.' },
    { name: 'Fiddle Leaf Fig', desc: 'Vibrant indoor tree featuring large, violin-shaped, dark green leaves.' }
  ],
  'Outdoor Plants': [
    { name: 'Neem', desc: 'A fast-growing evergreen tree widely known for its medicinal and air-purifying qualities.' },
    { name: 'Ashoka', desc: 'A tall, slender evergreen tree with beautiful foliage, traditionally planted at gates.' },
    { name: 'Bamboo', desc: 'Fast-growing woody stalks that make an excellent natural privacy screen.' },
    { name: 'Ficus Benjamina', desc: 'Weeping fig with graceful arching branches and glossy oval leaves.' },
    { name: 'Gulmohar', desc: 'Famous for its flamboyant display of bright orange-red flowers in summer.' },
    { name: 'Kadamba', desc: 'A majestic tree with large, broad leaves and round, orange-scented flower heads.' },
    { name: 'Bottle Brush', desc: 'Ornamental shrub displaying unique, bright red cylindrical flowers resembling brushes.' },
    { name: 'Arjuna', desc: 'A large deciduous tree with fibrous bark, valued for its medicinal properties.' },
    { name: 'Kachnar', desc: 'Beautiful orchid-like pink flowers bloom on this small to medium sized tree.' },
    { name: 'Champa', desc: 'Highly fragrant cream-white flowers with yellow centers, loved in garden landscaping.' },
    { name: 'Rain Tree', desc: 'A massive shade tree with a broad, dome-shaped canopy that folds leaves on rainy days.' },
    { name: 'Silver Oak', desc: 'Tall tree with silver-lined, fern-like leaves, popular as windbreaks in estates.' },
    { name: 'Amaltas', desc: 'Also known as the Golden Shower tree, producing cascading yellow flowers.' },
    { name: 'Pongamia', desc: 'A hardy tree that provides dense shade, producing clusters of lavender-white blooms.' },
    { name: 'Indian Cork Tree', desc: 'Tall tree with deeply fissured bark and highly fragrant tubular white flowers.' }
  ],
  'Flowering Plants': [
    { name: 'Rose', desc: 'Classic, romantic red blooms that release a sweet, captivating scent.' },
    { name: 'Hibiscus', desc: 'Showy, large tropical flowers that attract hummingbirds and butterflies.' },
    { name: 'Jasmine', desc: 'Delicate white star-shaped flowers with an intensely fragrant perfume.' },
    { name: 'Marigold', desc: 'Bright yellow-orange annuals that naturally repel insect pests.' },
    { name: 'Bougainvillea', desc: 'Hardy paper-like colorful bracts that cover the plant in vibrant colors.' },
    { name: 'Sunflower', desc: 'Vibrant yellow flowers with large seed centers that track the sun.' },
    { name: 'Petunia', desc: 'Prolific blooming trumpet-shaped flowers, perfect for pots and containers.' },
    { name: 'Dahlia', desc: 'Symmetrical, layered blooms available in a wide variety of colors and patterns.' },
    { name: 'Chrysanthemum', desc: 'Compact flowering bushes featuring dense clusters of multi-petaled blooms.' },
    { name: 'Ixora', desc: 'Clusters of small, tubular red-pink flowers that bloom continuously.' },
    { name: 'Geranium', desc: 'Popular balcony plant with clusters of red, pink, or white flowers.' },
    { name: 'Zinnia', desc: 'Bright, colorful daisy-like flower heads that bloom under hot summer sun.' },
    { name: 'Sadabahar', desc: 'Perennial periwinkle plant that blooms year-round with pink or white flowers.' },
    { name: 'Orchid', desc: 'Exotic, elegant blooms that present refined beauty in indoor spaces.' },
    { name: 'Lily', desc: 'Large, trumpet-shaped flowers representing purity and refined grace.' }
  ],
  'Herbal & Medicinal Plants': [
    { name: 'Tulsi', desc: 'Holy Basil, revered for its immunity-boosting and respiratory properties.' },
    { name: 'Aloe Vera', desc: 'Fleshy leaves containing gel widely used for soothing skin and healing burns.' },
    { name: 'Mint', desc: 'Refreshing herb used in cooking, teas, and soothing digestive issues.' },
    { name: 'Giloy', desc: 'A climbing ayurvedic herb known for boosting platelet counts and immunity.' },
    { name: 'Lemongrass', desc: 'Aromatic grass releasing a strong lemon fragrance, perfect for herbal tea.' },
    { name: 'Curry Leaf', desc: 'Essential culinary herb with aromatic leaves that improve digestion.' },
    { name: 'Ajwain Plant', desc: 'Fleshy green leaves containing a strong oregano-like herbal scent.' },
    { name: 'Brahmi', desc: 'Traditional memory-boosting herb that grows well in moist soil conditions.' },
    { name: 'Ashwagandha', desc: 'Powerful adaptogen root herb that helps lower stress and anxiety levels.' },
    { name: 'Stevia', desc: 'Natural sweetener plant containing leaves that are 200 times sweeter than sugar.' },
    { name: 'Neem', desc: 'Antiseptic leaves widely used in traditional medicine and organic pesticides.' },
    { name: 'Turmeric', desc: 'Curcumin-rich rhizome herb providing powerful anti-inflammatory benefits.' },
    { name: 'Shatavari', desc: 'A climbing plant with delicate needle-like leaves, nourishing for female wellness.' },
    { name: 'Kalmegh', desc: 'Traditional ayurvedic bitter herb used to treat fevers and support liver health.' },
    { name: 'Patharchatta', desc: 'Miracle leaf plant known for helping dissolve kidney stones naturally.' }
  ],
  'Succulents & Cacti': [
    { name: 'Jade Plant', desc: 'Chubby oval leaves on woody stems. Symbolizes luck and financial growth.' },
    { name: 'Echeveria', desc: 'Beautiful rose-like symmetrical rosettes in pastel shades of green and pink.' },
    { name: 'Haworthia', desc: 'Hardy succulent with translucent windowed tips on zebra-striped leaves.' },
    { name: 'Zebra Cactus', desc: 'Zebra-striped succulent presenting small white ridges on dark green leaves.' },
    { name: 'Barrel Cactus', desc: 'Classic ribbed desert cactus covered in yellow defensive needles.' },
    { name: 'Moon Cactus', desc: 'Vibrant, colorful grafted cactus featuring red, yellow, or pink tops.' },
    { name: 'String of Pearls', desc: 'Unique hanging succulent with round, pea-like green leaves along long vines.' },
    { name: 'Sedum', desc: 'Low-growing, fleshy groundcover succulent that thrives in direct sun.' },
    { name: 'Kalanchoe', desc: 'Succulent presenting large green leaves and dense clusters of tiny flowers.' },
    { name: 'Agave', desc: 'Sharp, spiked thick leaves arranged in a monumental structural rosette.' },
    { name: 'Lithops', desc: 'Often called Living Stones, mimicking pebbles to avoid herbivores.' },
    { name: 'Crown Of Thorns', desc: 'Prickly desert shrub that blooms with small red flowers all year round.' },
    { name: 'Christmas Cactus', desc: 'Flat leaf segments that bloom with exotic pink flowers during winter.' },
    { name: 'Burro\'s Tail', desc: 'Overlapping plump blue-green leaves cascading from hanging containers.' },
    { name: 'Aloe Vera', desc: 'Drought-tolerant succulent providing soothing gel for hair and skin care.' }
  ],
  'Fruit Plants': [
    { name: 'Mango', desc: 'Grafted King of Fruits sapling, produces sweet, juicy mangoes.' },
    { name: 'Guava', desc: 'Hardy tree bearing vitamin-C rich guavas with white or pink flesh.' },
    { name: 'Lemon', desc: 'Evergreen citrus shrub producing sour lemons continuously.' },
    { name: 'Orange', desc: 'Fruity citrus tree bearing sweet, juicy oranges packed with vitamin C.' },
    { name: 'Pomegranate', desc: 'Produces sweet red arils enclosed in a tough leathery skin.' },
    { name: 'Papaya', desc: 'Fast-growing tropical herbaceous plant bearing sweet, large papayas.' },
    { name: 'Banana', desc: 'Lush tropical plant yielding heavy bunches of energy-rich bananas.' },
    { name: 'Chikoo', desc: 'Sapodilla tree bearing sweet, grainy brown fruits resembling potatoes.' },
    { name: 'Custard Apple', desc: 'Yields sweet, custard-like pulpy fruits with soft black seeds.' },
    { name: 'Dragon Fruit', desc: 'Climbing cactus producing unique, exotic scaly pink fruits.' },
    { name: 'Jamun', desc: 'Black plum tree bearing tart, purple berries that control blood sugar.' },
    { name: 'Litchi', desc: 'Tropical evergreen tree yielding sweet, translucent white arils.' },
    { name: 'Coconut', desc: 'Tall palm tree yielding refreshing coconuts with sweet water.' },
    { name: 'Amla', desc: 'Indian Gooseberry tree yielding sour, vitamin-C rich green berries.' },
    { name: 'Grapes', desc: 'Climbing grapevine producing sweet bunches of green or purple grapes.' }
  ],
  'Vegetable Plants': [
    { name: 'Tomato', desc: 'Fruity red vegetable sapling, essential for salads and curries.' },
    { name: 'Chilli', desc: 'Easy to grow, yielding hot, spicy green or red pepper pods.' },
    { name: 'Brinjal', desc: 'Eggplant sapling, yielding glossy purple fruits loved in stews.' },
    { name: 'Okra', desc: 'Ladies finger plant, producing tender green pods rich in fiber.' },
    { name: 'Cabbage', desc: 'Produces a dense leafy green head, ideal for winter stir-fries.' },
    { name: 'Cauliflower', desc: 'Seasonal vegetable producing a dense white curd of flower buds.' },
    { name: 'Spinach', desc: 'Palak, rich in iron, grows quickly in partial shade conditions.' },
    { name: 'Coriander', desc: 'Fresh herb used for garnishing and aromatic green chutneys.' },
    { name: 'Fenugreek', desc: 'Methi leaves, bitter-sweet herb used in flatbreads and curries.' },
    { name: 'Bottle Gourd', desc: 'Lauki vine producing long, light-green hydrating vegetables.' },
    { name: 'Bitter Gourd', desc: 'Karela, highly medicinal bitter vegetable that regulates sugar.' },
    { name: 'Ridge Gourd', desc: 'Turai, ribbed gourd vegetable that is easy to digest.' },
    { name: 'Cucumber', desc: 'Hydrating, crunchy salad vegetable vine that grows well on trellises.' },
    { name: 'Capsicum', desc: 'Sweet bell pepper plant producing crunchy green, red, or yellow pods.' },
    { name: 'Beans', desc: 'Green bush bean plant yielding tender, snap pods packed with protein.' }
  ],
  'Air Purifying Plants': [
    { name: 'Snake Plant', desc: 'Filters benzene, formaldehyde, and trichloroethylene from rooms.' },
    { name: 'Spider Plant', desc: 'Safe for pets, removes carbon monoxide and xylene effectively.' },
    { name: 'Peace Lily', desc: 'Releases moisture into dry air, neutralizing benzene and ammonia.' },
    { name: 'Areca Palm', desc: 'Acts as a natural humidifier, filtering toluene and carbon dioxide.' },
    { name: 'Rubber Plant', desc: 'Large leaves absorb chemical toxins emitted from carpets and furniture.' },
    { name: 'Aloe Vera', desc: 'Clears air of benzene while emitting oxygen at night for better sleep.' },
    { name: 'Bamboo Palm', desc: 'Hardy palm that filters formaldehyde, trichloroethylene, and benzene.' },
    { name: 'English Ivy', desc: 'Vining plant shown to reduce airborne mold particles in homes.' },
    { name: 'Boston Fern', desc: 'Feathery hanging fern that filters formaldehyde and humidifies rooms.' },
    { name: 'Philodendron', desc: 'Vibrant indoor climber that cleans carbon dioxide and VOCs from air.' },
    { name: 'Dracaena', desc: 'Upright ornamental species that removes trichloroethylene and xylene.' },
    { name: 'Golden Pothos', desc: 'Devil\'s Ivy, virtually indestructible vine that purifies indoor air.' },
    { name: 'Chinese Evergreen', desc: 'Slow-growing foliage plant that removes carbon monoxide and benzene.' },
    { name: 'Weeping Fig', desc: 'Ficus tree that cleans airborne toxins emitted from paints and polishes.' },
    { name: 'ZZ Plant', desc: 'Slows and absorbs nitrogen dioxide and carbon monoxide in offices.' }
  ],
  'Bonsai Plants': [
    { name: 'Ficus Bonsai', desc: 'Gnarled, thick trunk with tiny green leaves, perfect for beginners.' },
    { name: 'Jade Bonsai', desc: 'Succulent bonsai resembling an ancient tree with fleshy green leaves.' },
    { name: 'Banyan Bonsai', desc: 'Miniature version of the sacred Banyan tree, showing aerial roots.' },
    { name: 'Juniper Bonsai', desc: 'Classic Japanese bonsai showing needle-like evergreen foliage.' },
    { name: 'Bougainvillea Bonsai', desc: 'Dwarf flowering bonsai covered in papery purple-pink flower bracts.' },
    { name: 'Tamarind Bonsai', desc: 'Features delicate compound leaves that fold closed at night.' },
    { name: 'Chinese Elm Bonsai', desc: 'A very popular bonsai featuring a twisted trunk and fine twigs.' },
    { name: 'Schefflera Bonsai', desc: 'Umbrella tree bonsai, showing compact multi-fingered leaf crowns.' },
    { name: 'Fukien Tea Bonsai', desc: 'Shiny, small leaves with white flowers and miniature red berries.' },
    { name: 'Carmona Bonsai', desc: 'Fukien Tea specimen trained in traditional curved upright style.' },
    { name: 'Peepal Bonsai', desc: 'Sacred fig tree bonsai presenting heart-shaped tail-tipped leaves.' },
    { name: 'Pine Bonsai', desc: 'Represents longevity in Japan, featuring sharp needle whorls.' },
    { name: 'Neem Bonsai', desc: 'Miniaturised neem tree showing tooth-edged medicinal leaves.' },
    { name: 'Hibiscus Bonsai', desc: 'Rare dwarf bonsai bearing brilliant, showy trumpet flowers.' },
    { name: 'Acacia Bonsai', desc: 'Mini thorn-tree presenting yellow puff blossoms and tiny leaflets.' }
  ],
  'Hanging & Creeper Plants': [
    { name: 'Money Plant', desc: 'Golden Pothos vine cascading gracefully down from hanging pots.' },
    { name: 'English Ivy', desc: 'Climbing vine with star-shaped leaves, covers brick walls elegantly.' },
    { name: 'String Of Pearls', desc: 'Cascading stems carrying succulent, green spherical bead leaves.' },
    { name: 'Spider Plant', desc: 'Forms arching runners carrying miniature clone offsets.' },
    { name: 'Heartleaf Philodendron', desc: 'Vibrant green heart-shaped leaves on long, trailing stems.' },
    { name: 'Pothos', desc: 'Devil\'s Ivy, extremely easy trailing houseplant with green/yellow foliage.' },
    { name: 'Hoya', desc: 'Wax plant vine producing highly fragrant, porcelain-like star flowers.' },
    { name: 'Wandering Jew', desc: 'Tradescantia, displaying striking purple-and-silver striped leaves.' },
    { name: 'Boston Fern', desc: 'Dense hanging crown of arching fronds that adore high humidity.' },
    { name: 'Dischidia', desc: 'Epiphytic trailing plant with tiny button-like succulent leaves.' },
    { name: 'Lipstick Plant', desc: 'Vining houseplant producing bright red tubular flowers from dark cups.' },
    { name: 'Creeping Jenny', desc: 'Low-growing crawler plant carrying coin-shaped yellow-green leaves.' },
    { name: 'Syngonium', desc: 'Climbing goosefoot vine carrying beautiful pale green/pink leaves.' },
    { name: 'Monstera Adansonii', desc: 'Five Holes plant, trailing climber featuring windows in oval leaves.' },
    { name: 'Turtle Vine', desc: 'Densely packed, tiny purple-green creeping leaves forming a soft cushion.' }
  ]
};

const getPrice = (categoryName, index) => {
  const base = (index * 47) % 10; // 0 to 9
  let min = 150, max = 500;
  if (categoryName === 'Indoor Plants') { min = 149; max = 899; }
  else if (categoryName === 'Flowering Plants') { min = 99; max = 699; }
  else if (categoryName === 'Succulents & Cacti') { min = 99; max = 499; }
  else if (categoryName === 'Fruit Plants') { min = 299; max = 1499; }
  else if (categoryName === 'Bonsai Plants') { min = 799; max = 4999; }
  else if (categoryName === 'Outdoor Plants') { min = 199; max = 999; }
  else if (categoryName === 'Herbal & Medicinal Plants') { min = 99; max = 399; }
  else if (categoryName === 'Vegetable Plants') { min = 49; max = 199; }
  else if (categoryName === 'Air Purifying Plants') { min = 149; max = 799; }
  else if (categoryName === 'Hanging & Creeper Plants') { min = 129; max = 599; }
  
  const price = min + Math.floor((max - min) * (base / 9.0));
  // Round to nearest 10, then subtract 1 for psychological pricing (e.g. 299)
  return Math.round(price / 10) * 10 - 1;
};

const getStock = (index) => {
  return 5 + ((index * 7) % 40); // 5 to 44
};

const getCareInstructions = (categoryName) => {
  if (categoryName === 'Indoor Plants' || categoryName === 'Air Purifying Plants') {
    return {
      light: 'Bright indirect indoor light. Avoid hot direct windows.',
      water: 'Water when top 1-2 inches of soil feels dry. Do not water log.',
      soil: 'Rich, airy, well-draining organic potting soil mixture.',
      temperature: '18°C - 28°C'
    };
  } else if (categoryName === 'Succulents & Cacti') {
    return {
      light: 'Bright partial sun to full direct sunlight. Tolerates hot windows.',
      water: 'Water deeply only when soil is bone dry. Every 2-3 weeks.',
      soil: 'Extremely porous, sandy/gritty succulent potting soil.',
      temperature: '15°C - 35°C'
    };
  } else if (categoryName === 'Bonsai Plants') {
    return {
      light: 'Bright light. Some direct sun depending on species. Needs air flow.',
      water: 'Water daily or as soon as soil surface feels dry. Never let dry completely.',
      soil: 'Special gritty bonsai akadama/clay/perlite mix.',
      temperature: '15°C - 30°C'
    };
  } else if (categoryName === 'Fruit Plants' || categoryName === 'Outdoor Plants' || categoryName === 'Flowering Plants') {
    return {
      light: 'Full direct sunlight. Minimum 5-6 hours of daily sunlight required.',
      water: 'Keep soil consistently moist. Water deeply during summer.',
      soil: 'Rich, compost-heavy loamy garden soil with good drainage.',
      temperature: '15°C - 40°C'
    };
  } else {
    return {
      light: 'Bright partial sun or light shade depending on outdoor conditions.',
      water: 'Water regularly to maintain light moisture. Do not let soil dry out.',
      soil: 'Well-draining, nutrient-rich soil enriched with organic compost.',
      temperature: '15°C - 32°C'
    };
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // 1. Clear Database
    await User.deleteMany();
    await Plant.deleteMany();
    await Category.deleteMany();
    await Order.deleteMany();
    await Cart.deleteMany();
    await Wishlist.deleteMany();
    await Review.deleteMany();
    await ContactMessage.deleteMany();

    console.log('Database cleared...');

    // 2. Create Default Users (User and Admin)
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@nurvana.com',
      phone: '9876543210',
      password: 'admin123',
      role: 'admin'
    });

    const regularUser = await User.create({
      name: 'Satyam Anand',
      email: 'user@nurvana.com',
      phone: '8765432109',
      password: 'user123',
      role: 'user'
    });

    // Create default carts & wishlists for them
    await Cart.create({ user: adminUser._id, items: [] });
    await Cart.create({ user: regularUser._id, items: [] });
    await Wishlist.create({ user: adminUser._id, plants: [] });
    await Wishlist.create({ user: regularUser._id, plants: [] });

    console.log('Demo users created...');

    // 3. Create Categories
    const createdCategories = await Category.insertMany(categoriesSeed);
    console.log('Categories seeded...');

    const getCatId = (name) => createdCategories.find(c => c.name === name)._id;

    // 4. Create Plants
    const plantsSeed = [];
    Object.keys(plantsData).forEach((catName) => {
      const catId = getCatId(catName);
      const list = plantsData[catName];
      list.forEach((item, index) => {
        plantsSeed.push({
          name: item.name,
          price: getPrice(catName, index),
          description: item.desc,
          category: catId,
          stock: getStock(index),
          careInstructions: getCareInstructions(catName),
          images: [getImagePath(catName, item.name)],
        });
      });
    });

    await Plant.insertMany(plantsSeed);
    console.log(`Successfully seeded ${plantsSeed.length} plants...`);

    // 5. Create some sample reviews to make the UI look dynamic
    const createdPlants = await Plant.find({});
    const moneyPlant = createdPlants.find(p => p.name === 'Money Plant');
    const snakePlant = createdPlants.find(p => p.name === 'Snake Plant');

    if (moneyPlant && snakePlant) {
      await Review.create({
        user: regularUser._id,
        plant: moneyPlant._id,
        rating: 5,
        comment: 'Absolutely stunning! The plant arrived in perfect condition, super healthy, and the packaging was excellent. Highly recommend Nurvana!'
      });

      await Review.create({
        user: adminUser._id,
        plant: moneyPlant._id,
        rating: 4,
        comment: 'Great growth over the past few weeks. Developing new leaves rapidly. Needs a sturdy moss pole.'
      });

      await Review.create({
        user: regularUser._id,
        plant: snakePlant._id,
        rating: 5,
        comment: 'This is the most low-maintenance plant I have ever bought. Perfect for my bedroom. Love the yellow stripes!'
      });

      console.log('Sample reviews seeded...');
    }

    // 6. Create sample contact message
    await ContactMessage.create({
      name: 'Rohan Sharma',
      email: 'rohan@gmail.com',
      subject: 'Bulk Inquiry for Office Decor',
      message: 'Hello, we are planning to decorate our corporate workspace with air-purifying indoor plants. Do you provide corporate packages or discounts for ordering 50+ plants? Looking forward to your response.'
    });

    console.log('Sample contact messages seeded...');
    console.log('Database Seeding Completed Successfully! 🌱');
    process.exit();
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
