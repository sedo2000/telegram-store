"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string | null;
};

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProducts() {
    try {
      const response = await fetch("/api/products");

      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <main dir="rtl" className="admin">
      <header className="admin-header">
        <div>
          <h1>🛠 لوحة الإدارة</h1>
          <p>إدارة منتجات المتجر</p>
        </div>

        <a href="/" className="store-button">
          🛒 المتجر
        </a>
      </header>

      <section className="admin-card">
        <div className="card-title">
          <h2>📦 المنتجات</h2>

          <button
            onClick={loadProducts}
            className="refresh-button"
          >
            🔄 تحديث
          </button>
        </div>

        {loading ? (
          <p>جاري التحميل...</p>
        ) : products.length === 0 ? (
          <p>لا توجد منتجات.</p>
        ) : (
          <div className="product-list">
            {products.map((product) => (
              <div
                className="admin-product"
                key={product.id}
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                  />
                ) : (
                  <div className="small-image">
                    📦
                  </div>
                )}

                <div>
                  <h3>{product.name}</h3>

                  <p>
                    {product.price.toLocaleString("ar-IQ")} د.ع
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-card telegram-card">
        <h2>📢 Telegram</h2>

        <p>
          عند ربط البوت بالقناة، سيتم استقبال المنتجات
          وتحديث المنتجات الموجودة بدل إنشاء منتجات مكررة.
        </p>

        <div className="telegram-status">
          🟡 لم يتم ربط Telegram بعد
        </div>
      </section>
    </main>
  );
}
