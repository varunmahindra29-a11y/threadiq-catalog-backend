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

test("findShopByMessage defaults to the only shop", () => {
  const shops = [{ id: "1", name: "Raj Fashion", slug: "raj-fashion" }];

  assert.equal(findShopByMessage(shops, "black shirt under 2000").id, "1");
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

test("rankProducts avoids unrelated products for specific category requests", () => {
  const products = [
    { id: "shirt", name: "White Minimal Linen Shirt", category: "Shirts", price: 1199, stock: 8, colors: ["White"], sizes: ["M"], inquiries: 5 },
    { id: "shoe", name: "White Street Sneakers", category: "Footwear", price: 1999, stock: 8, colors: ["White"], sizes: ["9"], inquiries: 50 },
    { id: "jacket", name: "Blue Denim Jacket", category: "Jackets", price: 2499, stock: 8, colors: ["Blue"], sizes: ["L"], inquiries: 30 },
  ];

  assert.deepEqual(
    rankProducts(products, "white shirt photo bhejo", 3).map((product) => product.id),
    ["shirt"],
  );
  assert.deepEqual(rankProducts(products, "red kurta dikhao", 3), []);
});

test("extractBudget and detectInterest parse common Hinglish messages", () => {
  assert.equal(extractBudget("black shirt under 1500 dikhao"), 1500);
  assert.equal(detectInterest("ye chahiye available hai?"), true);
  assert.equal(detectInterest("sirf products dikhao"), false);
});
