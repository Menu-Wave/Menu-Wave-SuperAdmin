import classicChickenBurger from "@/assets/classic-chicken-burger.png.asset.json";

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  emoji: string;
  image?: string;
};

export const menuItems: MenuItem[] = [
  { id: 1, name: "Bigwhizz Reloaded", price: 6400.36, category: "Top Sellers", emoji: "🍔" },
  { id: 2, name: "Refuel Max Combo", price: 3130.0, category: "Top Sellers", emoji: "🍗" },
  { id: 3, name: "Classic Chicken Burger", price: 2500.0, category: "Burgers & Sandwiches", emoji: "🍔", image: classicChickenBurger.url },
  { id: 4, name: "Spicy Chicken Sandwich", price: 2200.0, category: "Burgers & Sandwiches", emoji: "🥪" },
  { id: 5, name: "Citizen Meal - Chicken", price: 3800.0, category: "Citizens Meals", emoji: "🍱" },
  { id: 6, name: "Citizen Meal - Fish", price: 3500.0, category: "Citizens Meals", emoji: "🍱" },
  { id: 7, name: "Coca-Cola", price: 400.0, category: "Drinks", emoji: "🥤" },
  { id: 8, name: "Fanta", price: 400.0, category: "Drinks", emoji: "🥤" },
  { id: 9, name: "Sprite", price: 400.0, category: "Drinks", emoji: "🥤" },
  { id: 10, name: "Jollof Rice with Chicken", price: 3000.0, category: "POT Meals", emoji: "🍲" },
  { id: 11, name: "Fried Rice with Chicken", price: 3200.0, category: "POT Meals", emoji: "🍲" },
  { id: 12, name: "French Fries", price: 800.0, category: "Tasty Sides", emoji: "🍟" },
  { id: 13, name: "Onion Rings", price: 700.0, category: "Tasty Sides", emoji: "🧅" },
  { id: 14, name: "Coleslaw", price: 500.0, category: "Tasty Sides", emoji: "🥗" },
];

export const categories = [
  "Top Sellers",
  "Burgers & Sandwiches",
  "Citizens Meals",
  "Drinks",
  "POT Meals",
  "Tasty Sides",
];

export const categoryIcons: Record<string, string> = {
  "Top Sellers": "⭐",
  "Burgers & Sandwiches": "🍔",
  "Citizens Meals": "🍱",
  Drinks: "🥤",
  "POT Meals": "🍲",
  "Tasty Sides": "🍟",
};

export const formatNaira = (n: number) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
