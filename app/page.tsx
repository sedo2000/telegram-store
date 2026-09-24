"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  description?: string | null;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    loadProducts();
  }, []);

  return (
    <main dir="rtl" className="store">
      <header className="header">
        <div>
          <h1>🛒 متجري</h1>
          <p>منتجاتنا متوفرة الآن</p>
        </div>

        <a href="/admin" className="admin-button">
          لوحة الإدارة
        </a>
      </header>

      <section className="products">
        {loading ? (
          <div className="message">جاري تحميل المنتجات...</div>
        ) : products.length === 0 ? (
          <div className="message">
            لا توجد منتجات حاليًا
          </div>
        ) : (
          products.map((product) => (
            <article className="product" key={product.id}>
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                />
              ) : (
                <div className="no-image">
                  📦
                </div>
              )}

              <div className="product-info">
                <h2>{product.name}</h2>

                {product.description && (
                  <p>{product.description}</p>
                )}

                <strong>
                  {product.price.toLocaleString("ar-IQ")} د.ع
                </strong>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
