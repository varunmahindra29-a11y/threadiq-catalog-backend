import test from "node:test";
import assert from "node:assert/strict";
import { detectInterest, extractBudget, findShopByMessage, rankProducts } from "../backend/matching.mjs";

test("findShopByMessage matches shop name and slug", () => {
  const shops = [
    { id: "1", name: "Raj Fashion", slug: "raj-fashion" },
    { id: "2", name: "Urban Rack", slug: "urban-rack" },
  ];

  assert.equal(findShopByMessage(shops, "Raj Fashion ke products dikhao").id, "1");
  assert.equal(findShopByMessage(shops, "urban rack black shirt").id, "2");
});

test("rankProducts prefers budget and matching terms", () => {
  const products = [
    { id: "a", name: "Blue Denim Jacket", category: "Jackets", price: 3000, stock: 5, colors: ["Blue"], sizes: ["M"], inquiries: 5 },
    { id: "b", name: "Black Party Shirt", category: "Shirts", price: 1400, stock: 10, colors: ["Black"], sizes: ["L"], inquiries: 1 },
    { id: "c", name: "Black Shirt Premium", category: "Shirts", price: 2200, stock: 0, colors: ["Black"], sizes: ["L"], inquiries: 50 },
  ];

  const [first] = rankProducts(products, "black shirt under 1500 L size", 3);
  assert.equal(first.id, "b");
});

test("extractBudget and detectInterest parse common Hinglish messages", () => {
  assert.equal(extractBudget("black shirt under 1500 dikhao"), 1500);
  assert.equal(detectInterest("ye chahiye available hai?"), true);
  assert.equal(detectInterest("sirf products dikhao"), false);
});
