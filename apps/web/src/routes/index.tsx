import { createFileRoute } from "@tanstack/react-router";
import { AboutSection } from "@/components/landing/about-section";
import { BlogPreviewSection } from "@/components/landing/blog-preview-section";
import { BookingSection } from "@/components/landing/booking-section";
import { ContactSection } from "@/components/landing/contact-section";
import { HeroSection } from "@/components/landing/hero-section";
import { MehfilSection } from "@/components/landing/mehfil-section";
import {
  ReleasesSection,
  releasesQuery,
} from "@/components/landing/release-carousel";
import {
  SocialFeedSection,
  socialLayoutQuery,
} from "@/components/landing/social-feed-section";
import { PublicLayout } from "@/components/layout/public-layout";
import { siteSettingsQuery, useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.prefetchQuery(siteSettingsQuery),
      context.queryClient.prefetchQuery(releasesQuery),
      context.queryClient.prefetchQuery(socialLayoutQuery),
    ]),
  component: HomePage,
});

function HomePage() {
  const { data: s } = useSiteSettings();
  return (
    <PublicLayout>
      <HeroSection s={s} />
      <ReleasesSection />
      <AboutSection s={s} />
      <MehfilSection s={s} />
      <BookingSection s={s} />
      <SocialFeedSection s={s} />
      <BlogPreviewSection />
      <ContactSection s={s} />
    </PublicLayout>
  );
}
