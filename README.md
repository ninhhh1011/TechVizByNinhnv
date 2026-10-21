# TechViz Sandbox Encyclopedia 🚀

Bách khoa toàn thư tương tác trực quan hóa thuật toán, cấu trúc dữ liệu và kiến trúc hệ thống phân tán, chuẩn cơ sở học thuật (CLRS & DDIA) kết hợp phong cách thiết kế Fintech Techcombank Red-White.

![TechViz Sandbox](https://img.shields.io/badge/TechViz-v2.0-E31B23?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.4.4-646CFF?style=for-the-badge&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.19-38B2AC?style=for-the-badge&logo=tailwind-css)

---

## 🌟 Điểm nổi bật (Key Features)

1. **5 Visualization Engines Chuyên biệt**:
   - `array-pointer`: Trực quan hóa mảng 1D, hai con trỏ, so sánh độ cao cột và âm thanh tần số Web Audio bíp (QuickSort Lomuto, Binary Search, BubbleSort).
   - `grid-path`: Không gian lưới 2D tìm đường tối ưu A* / Dijkstra, kéo thả chuột vẽ vật cản thời gian thực.
   - `flow-graph`: Kiến trúc hệ thống phân tán đa tầng, gói tin bay theo quỹ đạo SVG với mô phỏng chuyển giao trạng thái (Kafka, Redis, RAG, Load Balancer, Token Bucket).
   - `swarm-2d`: Không gian bầy đàn 2D mô phỏng PSO (Particle Swarm Optimization) và giải thuật di truyền GA tìm cực trị toàn cục $gBest$.
   - `tree-graph`: Cây đệ quy phân nhánh chia để trị (MergeSort Recursion Tree), cây nhị phân tìm kiếm BST.

2. **Khu vực Sư phạm Chuẩn Khoa học Máy tính**:
   - **Academic Concept Overview**: Bản chất & mô hình trực quan (Mental Model), cơ sở lý thuyết & độ phức tạp Big-O, và ứng dụng thực tiễn trong công nghiệp.
   - **Step Deep-Dive Inspector**: Diễn giải nguyên nhân của từng bước, mã giả thực thi (`logicCode`), và bảng biến số thời gian thực (`stateVariables`).

3. **Groq AI Pipeline Thông minh**:
   - Nhập bất kỳ thuật toán hoặc công nghệ nào, Groq LLM (Llama 3.3 70B, GPT-OSS) tự động phân loại engine phù hợp và tạo kịch bản 5-8 bước chân thực.
   - Cơ chế Fallback an toàn và Sanitizer phòng thủ chống lỗi runtime.

4. **Điều khiển & Tương tác Thân thiện**:
   - Playback Dock: Chạy tự động (Auto-play), tua bước, điều chỉnh tốc độ (0.5x, 1x, 2x).
   - Phím tắt bàn phím: `ArrowLeft` (Lùi bước), `ArrowRight` (Tiến bước).

---

## 🛠️ Cài đặt & Chạy ứng dụng

```bash
# Cài đặt dependencies
npm install

# Khởi chạy server phát triển (Development)
npm run dev

# Đóng gói sản phẩm (Production Build)
npm run build
```

---

## 📁 Cấu trúc Thư mục

```
src/
├── components/          # 5 Visualization Engines, Banner Sư phạm, Playback Dock, Header
│   ├── ArrayPointerRenderer.tsx
│   ├── FlowGraphRenderer.tsx
│   ├── GridPathRenderer.tsx
│   ├── Swarm2DRenderer.tsx
│   ├── TreeGraphRenderer.tsx
│   ├── StorytellerBanner.tsx
│   ├── PlaybackDock.tsx
│   ├── HeroHeader.tsx
│   └── ApiKeyModal.tsx
├── data/                # 11 kịch bản mẫu phong phú (Kafka, Redis, RAG, QuickSort, PSO, MergeSort...)
├── services/            # Groq AI Service, API Key manager, Model Fallback
├── types/               # Type definitions (SimulationScenario, SimulationStep, Engines...)
└── utils/               # Web Audio API tone generator
```

---

## 📜 Giấy phép & Tác quyền

Phát triển bởi **ninhnv** &bull; TechViz Sandbox Encyclopedia.
