import test from "node:test";
import assert from "node:assert/strict";
import { detectInterest, extractBhk, extractBudget, extractListingType, findShopByMessage, rankProperties } from "../backend/matching.mjs";

test("findShopByMessage matches broker name and slug", () => {
  const shops = [
    { id: "1", name: "EstateIQ Demo Realty", slug: "estateiq-demo-realty" },
    { id: "2", name: "Metro Homes", slug: "metro-homes" },
  ];

  assert.equal(findShopByMessage(shops, "EstateIQ Demo Realty ke flats dikhao").id, "1");
  assert.equal(findShopByMessage(shops, "metro homes 2bhk rent").id, "2");
});

test("findShopByMessage defaults to the only broker", () => {
  const shops = [{ id: "1", name: "EstateIQ Demo Realty", slug: "estateiq-demo-realty" }];

  assert.equal(findShopByMessage(shops, "2BHK rent in Andheri under 50k").id, "1");
});

test("extractBudget, listing type, and BHK parse real estate messages", () => {
  assert.equal(extractBudget("2BHK furnished flat rent in Andheri under 50k"), 50000);
  assert.equal(extractBudget("Noida flat buy budget 85 lakh"), 8500000);
  assert.equal(extractBudget("villa sale under 3.5 cr"), 35000000);
  assert.equal(extractListingType("rent ke liye furnished apartment chahiye"), "rent");
  assert.equal(extractListingType("Noida mein flat buy karna hai"), "sale");
  assert.equal(extractBhk("3 BHK sale property"), 3);
});

test("rankProperties prefers locality, BHK, budget, and listing type", () => {
  const properties = [
    {
      id: "sale-powai",
      title: "Lake-view 3BHK in Powai",
      listing_type: "sale",
      property_type: "Apartment",
      locality: "Powai",
      city: "Mumbai",
      price: 28500000,
      bhk: 3,
      area_sqft: 1280,
      furnishing: "Semi-furnished",
      availability: "Ready to move",
      amenities: ["Clubhouse"],
      status: "active",
      inquiries: 20,
      visits: 4,
    },
    {
      id: "rent-andheri",
      title: "Furnished 2BHK near Andheri West Metro",
      listing_type: "rent",
      property_type: "Apartment",
      locality: "Andheri West",
      city: "Mumbai",
      price: 48000,
      bhk: 2,
      area_sqft: 780,
      furnishing: "Furnished",
      availability: "Immediate",
      amenities: ["Parking"],
      status: "active",
      inquiries: 8,
      visits: 3,
    },
    {
      id: "rent-bandra",
      title: "Compact studio in Bandra West",
      listing_type: "rent",
      property_type: "Studio",
      locality: "Bandra West",
      city: "Mumbai",
      price: 42000,
      bhk: 0,
      area_sqft: 410,
      furnishing: "Furnished",
      availability: "Immediate",
      amenities: ["Security"],
      status: "active",
      inquiries: 50,
      visits: 9,
    },
  ];

  const [first] = rankProperties(properties, "2BHK furnished flat rent in Andheri under 50k", 3);
  assert.equal(first.id, "rent-andheri");
});

test("rankProperties respects clear rent and sale intent", () => {
  const properties = [
    { id: "rent", title: "2BHK rent in Andheri", listing_type: "rent", property_type: "Apartment", locality: "Andheri", city: "Mumbai", price: 50000, bhk: 2, status: "active" },
    { id: "sale", title: "2BHK sale in Andheri", listing_type: "sale", property_type: "Apartment", locality: "Andheri", city: "Mumbai", price: 12000000, bhk: 2, status: "active" },
  ];

  assert.deepEqual(
    rankProperties(properties, "2BHK rent in Andheri", 3).map((property) => property.id),
    ["rent"],
  );
  assert.deepEqual(
    rankProperties(properties, "2BHK buy in Andheri", 3).map((property) => property.id),
    ["sale"],
  );
});

test("detectInterest parses site visit and callback intent", () => {
  assert.equal(detectInterest("ye flat chahiye site visit karna hai"), true);
  assert.equal(detectInterest("broker se call kara do"), true);
  assert.equal(detectInterest("sirf properties dikhao"), false);
});
