import HeroSlider from '@/components/home/HeroSlider';
import ParallaxShowcase from '@/components/home/ParallaxShowcase';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import SellerShowcase from '@/components/home/SellerShowcase';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ivory-100 text-stone-900 selection:bg-gold-500 selection:text-white">
      <Navbar />
      <HeroSlider />
      <ParallaxShowcase />
      <CategoryGrid />
      <FeaturedProducts />
      <SellerShowcase />
      <Footer />
      <CartDrawer />
    </main>
  );
}
