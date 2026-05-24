const fallbackCatalog = [
  {
    id: "fallback-black-party-kurta",
    name: "Black Embroidered Party Kurta",
    description: "Black festive kurta with subtle embroidery, perfect for birthday parties, family functions, and evening events.",
    category: "Ethnic",
    price: 1499,
    stock: 12,
    sizes: ["M", "L", "XL"],
    colors: ["Black"],
    inquiries: 32,
    orders: 8,
    localImage: "black-party-kurta.jpg",
    remoteImage: "https://images.unsplash.com/photo-1614251056216-f748f76cd228?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-white-linen-shirt",
    name: "White Minimal Linen Shirt",
    description: "Clean white linen-look shirt for smart casual looks, dates, office wear, and summer styling.",
    category: "Shirts",
    price: 1199,
    stock: 18,
    sizes: ["S", "M", "L", "XL"],
    colors: ["White"],
    inquiries: 27,
    orders: 6,
    localImage: "white-linen-shirt.jpg",
    remoteImage: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-blue-denim-jacket",
    name: "Blue Washed Denim Jacket",
    description: "Classic blue denim jacket that works over tees, shirts, and kurtas for a bold streetwear layer.",
    category: "Jackets",
    price: 2499,
    stock: 9,
    sizes: ["M", "L", "XL"],
    colors: ["Blue"],
    inquiries: 24,
    orders: 5,
    localImage: "blue-denim-jacket.jpg",
    remoteImage: "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-rust-kurta-set",
    name: "Rust Festive Kurta Set",
    description: "Warm rust kurta set for festive days, mehendi functions, and traditional party looks.",
    category: "Ethnic",
    price: 1799,
    stock: 10,
    sizes: ["S", "M", "L"],
    colors: ["Rust", "Orange"],
    inquiries: 21,
    orders: 4,
    localImage: "rust-kurta-set.jpg",
    remoteImage: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-sage-trousers",
    name: "Sage Relaxed Trousers",
    description: "Relaxed sage trousers with a clean fall, easy to pair with white, black, or printed shirts.",
    category: "Trousers",
    price: 1399,
    stock: 14,
    sizes: ["30", "32", "34", "36"],
    colors: ["Sage", "Green"],
    inquiries: 19,
    orders: 3,
    localImage: "sage-trousers.jpg",
    remoteImage: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "fallback-white-street-sneakers",
    name: "White Street Sneakers",
    description: "Minimal white sneakers for everyday outfits, party casual looks, and college styling.",
    category: "Footwear",
    price: 1999,
    stock: 20,
    sizes: ["7", "8", "9", "10"],
    colors: ["White"],
    inquiries: 30,
    orders: 9,
    localImage: "white-sneakers.jpg",
    remoteImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80",
  },
];

export function fallbackShop() {
  return {
    id: "fallback-raj-fashion",
    name: "Raj Fashion",
    slug: "raj-fashion",
    owner_name: "Raj Fashion Owner",
    owner_whatsapp: null,
    tone: "friendly local fashion salesman",
  };
}

export function fallbackProducts(config, shopId = "fallback-raj-fashion") {
  const publicBaseUrl = config.publicBaseUrl?.replace(/\/$/, "");
  return fallbackCatalog.map(({ localImage, remoteImage, ...product }) => ({
    ...product,
    shop_id: shopId,
    status: "active",
    image_url: publicBaseUrl ? `${publicBaseUrl}/product-images/${localImage}` : remoteImage,
  }));
}

export function firstFallbackImageUrl(config) {
  return fallbackProducts(config)[0]?.image_url || "";
}
