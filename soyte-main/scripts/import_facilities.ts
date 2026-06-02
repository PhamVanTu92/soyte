const API_URL = "https://suckhoethudo.vn:7006/api/social-facilities";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Niwicm9sZSI6ImFkbWluIiwicGVybWlzc2lvbnMiOlsiZW1haWxfY29uZmlybSIsImV2YWx1YXRlIiwiZmVlZGJhY2siLCJmb3JtcyIsInBlcm1pc3Npb25zIiwicG9zdHMiLCJyZWZsZWN0IiwicmVwb3J0Iiwic29jaWFsX2ZhY2lsaXRpZXMiLCJ1c2VycyIsIndvcmtfc2NoZWR1bGUiXSwiaWF0IjoxNzc0OTI3MjEzLCJleHAiOjE3NzUwMTM2MTN9.TkK5Xl4BYKguG7xbIkT3IQKTnnrHqWIrJgMkJ5xzsV8"; // PASTE YOUR TOKEN HERE

const facilities = [
  {
    name: "BV K74 Vĩnh Phúc",
    type: "BV",
    category: "Cơ sở y tế thuộc Trung ương và Bộ Ngành",
    phone: "02113868204",
    address: "Đường Triệu Thị Khoan Hòa, Phường Phúc Yên, Phú Thọ",
    latitude: 21.3056,
    longitude: 105.7083,
    description: "Khoảng cách: 04 km, Giường KH: 450"
  },
  {
    name: "BVĐK Phúc Yên",
    type: "BV",
    category: "Bệnh viện",
    phone: "02113869150",
    address: "Phường Phúc Yên, Tỉnh Phú Thọ",
    latitude: 21.25866,
    longitude: 105.71761,
    description: "Khoảng cách: 06 km, Giường KH: 870"
  },
  {
    name: "BV Giao thông vận tải vĩnh phúc",
    type: "BV",
    category: "Cơ sở y tế thuộc Trung ương và Bộ Ngành",
    phone: "02113869114",
    address: "Tổ dân phố 4 Đạm Nội, Phường Phúc Yên, Tỉnh Phú Thọ",
    latitude: 21.25923,
    longitude: 105.72765,
    description: "Khoảng cách: 06 km, Giường KH: 230"
  },
  {
    name: "BVĐK Mê Linh",
    type: "BV",
    category: "Bệnh viện",
    phone: "02438161224",
    address: "Thôn 1, xã Yên Lãng, TP Hà Nội",
    latitude: 21.20668,
    longitude: 105.65582,
    description: "Khoảng cách: 07 km, Giường KH: 330"
  },
  {
    name: "BV Nhiệt đới TW (CS Đông Anh)",
    type: "BV",
    category: "Cơ sở y tế thuộc Trung ương và Bộ Ngành",
    phone: "02435810170",
    address: "Thôn Bầu, Xã Kim Chung, Thành Phố Hà Nội",
    latitude: 21.16390,
    longitude: 105.79468,
    description: "Khoảng cách: 14 km, Giường KH: 1000"
  },
  {
    name: "BVĐK Đông Anh",
    type: "BV",
    category: "Bệnh viện",
    phone: "02438832450",
    address: "Tổ 1, Xã Đông Anh, Hà Nội",
    latitude: 21.13963,
    longitude: 105.83685,
    description: "Khoảng cách: 20 km, Giường KH: 500"
  },
  {
    name: "BV Bắc Thăng Long",
    type: "BV",
    category: "Bệnh viện",
    phone: "02438832727",
    address: "Tổ 18 xã Đông Anh, thành phố Hà Nội",
    latitude: 21.14441,
    longitude: 105.83359,
    description: "Khoảng cách: 22 km, Giường KH: 400"
  },
  {
    name: "BV Sóc Sơn",
    type: "BV",
    category: "Bệnh viện",
    phone: "02435953784",
    address: "Số 18 Đường Bệnh Viện, Tiên Dược, Sóc Sơn, Hà Nội",
    latitude: 21.24647,
    longitude: 105.84589,
    description: "Khoảng cách: 24 km, Giường KH: 360"
  },
  {
    name: "TTYT Yên Lạc",
    type: "TT",
    category: "Trung tâm",
    phone: "02113836115",
    address: "Đ. Dương Tĩnh, Yên Lạc, Phú Thọ",
    latitude: 21.24580,
    longitude: 105.57866,
    description: "Khoảng cách: 12 km, Giường KH: 270"
  },
  {
    name: "TTYT Phúc Yên",
    type: "TT",
    category: "Trung tâm",
    phone: "02113873401",
    address: "phường Nam Viêm, tỉnh Phú Thọ",
    latitude: 21.25461,
    longitude: 105.71185,
    description: "Khoảng cách: 15 km, Giường KH: 110"
  },
  {
    name: "TTYT Bình xuyên",
    type: "TT",
    category: "Trung tâm",
    phone: "02113866115",
    address: "Thôn Chợ Cánh, xã Bình Nguyên, tỉnh Phú Thọ",
    latitude: 21.28292,
    longitude: 105.62939,
    description: "Khoảng cách: 13 km, Giường KH: 150"
  }
];

async function importFacilities() {
  console.log(`Starting import of ${facilities.length} facilities...`);

  for (const facility of facilities) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AUTH_TOKEN}`,
          "Accept": "application/json"
        },
        body: JSON.stringify(facility)
      });

      if (response.ok) {
        console.log(`✅ Success: ${facility.name}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed: ${facility.name} - ${response.status} ${response.statusText}`, errorText);
      }
    } catch (error) {
      console.error(`❌ Error reporting ${facility.name}:`, error);
    }
  }

  console.log("Import process complete.");
}

importFacilities();
