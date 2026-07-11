import classicChickenBurger from "@/assets/classic-chicken-burger.png.asset.json";
import burger from "@/assets/Burger.png.asset.json";
import coke from "@/assets/Coke.png.asset.json";
import fanta from "@/assets/Fanta.png.asset.json";
import coleslaw from "@/assets/Cosslaw.png.asset.json";
import friedChicken from "@/assets/Fried Chicken.png.asset.json";
import friedYam from "@/assets/Fried Yam.png.asset.json";
import moiMoi from "@/assets/Moi-Moi.png.asset.json";
import pepperSauce from "@/assets/Pepper Sauce.png.asset.json";
import plantain from "@/assets/Plantain.png.asset.json";
import potatoFries from "@/assets/Potato Fries.png.asset.json";
import spag from "@/assets/Spag.png.asset.json";
import tableWater from "@/assets/Table Water.png.asset.json";
import thePot from "@/assets/The Pot.png.asset.json";
import bread from "@/assets/Bread.png.asset.json";
import friedRice from "@/assets/fried rice.png.asset.json";
import jollofChicken from "@/assets/jollof rice and chicken.png.asset.json";
import jollofRice from "@/assets/jollof rice.png.asset.json";
import refuelMeal from "@/assets/refuel meal.png.asset.json";

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  category: string;
  emoji: string;
  image?: string;
};

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

// Local image assets keyed by menu item name (case-insensitive match).
export const imageByName: Record<string, string> = {
  "bigwhizz reloaded": burger.url,
  "refuel max combo": refuelMeal.url,
  "classic chicken burger": classicChickenBurger.url,
  bread: bread.url,
  "fried chicken": friedChicken.url,
  "citizen meal -moi-moi": moiMoi.url,
  "coca-cola": coke.url,
  fanta: fanta.url,
  "table water": tableWater.url,
  "jollof rice with chicken": jollofChicken.url,
  "fried rice with chicken": friedRice.url,
  "jollof rice": jollofRice.url,
  spaghetti: spag.url,
  "the pot special": thePot.url,
  "french fries": potatoFries.url,
  coleslaw: coleslaw.url,
  plantain: plantain.url,
  "fried yam": friedYam.url,
  "moi-moi": moiMoi.url,
  "pepper sauce": pepperSauce.url,
};

export const imageForName = (name: string): string | undefined =>
  imageByName[name.trim().toLowerCase()];

export const formatNaira = (n: number) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
