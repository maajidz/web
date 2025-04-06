import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import Section from '@/components/Section';
import InfoCard from '@/components/InfoCard';
import TestimonialCard from '@/components/TestimonialCard';
import PricingCard from '@/components/PricingCard';
import CtaCard from '@/components/CtaCard';
import TabBar from '@/components/TabBar';
import {
  RiProfileLine,
  RiHeartLine,
  RiChat1Line,
  RiShieldCheckLine,
  RiMagicLine,
  RiMapPinLine
} from 'react-icons/ri';

// Load keys from environment variables
const TRUECALLER_PARTNER_KEY = process.env.NEXT_PUBLIC_TRUECALLER_PARTNER_KEY || "";
const TRUECALLER_PARTNER_NAME = process.env.NEXT_PUBLIC_TRUECALLER_PARTNER_NAME || "";
const PHONE_EMAIL_CLIENT_ID = process.env.NEXT_PUBLIC_PHONE_EMAIL_CLIENT_ID || "";

export default function Home() {

  // Optional: Add checks to ensure environment variables are loaded
  if (!TRUECALLER_PARTNER_KEY || !TRUECALLER_PARTNER_NAME || !PHONE_EMAIL_CLIENT_ID) {
      console.error("Missing required environment variables for authentication!");
      // Optionally return an error message or minimal UI
      // return <div>Error: Missing configuration.</div>;
  }

  return (
    // Use font-sans defined in tailwind.config.js
    <div className="font-sans bg-base-100 text-base-content min-h-screen">
      <Navbar />

      {/* Add padding top/bottom to account for fixed nav/tab bars */}
      <main className="pt-16 pb-16">
        <HeroSection 
            partnerKey={TRUECALLER_PARTNER_KEY}
            partnerName={TRUECALLER_PARTNER_NAME}
            phoneEmailClientId={PHONE_EMAIL_CLIENT_ID}
        />

        <Section id="how-it-works" title="How Flattr Works">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <InfoCard
              icon={<RiProfileLine />}
              title="Create Your Profile"
              description="Tell us about your lifestyle, preferences, and what you're looking for in a flatmate."
            />
            <InfoCard
              icon={<RiHeartLine />}
              title="Swipe & Match"
              description="Browse potential flatmates and swipe right on those who seem compatible with you."
            />
            <InfoCard
              icon={<RiChat1Line />}
              title="Connect & Chat"
              description="Message your matches, arrange meetups, and find your perfect flatmate."
            />
          </div>
        </Section>

        <Section className="bg-base-200/50" title="Why Choose Flattr">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <InfoCard
              align="left"
              icon={<RiShieldCheckLine />}
              iconBgClass="bg-secondary/20"
              iconTextClass="text-secondary"
              title="Verified Profiles"
              description="All users are verified through social media or ID verification for your safety and peace of mind."
            />
             <InfoCard
              align="left"
              icon={<RiMagicLine />}
              iconBgClass="bg-secondary/20"
              iconTextClass="text-secondary"
              title="Smart Matching"
              description="Our algorithm considers lifestyle, habits, and preferences to suggest the most compatible flatmates."
            />
             <InfoCard
              align="left"
              icon={<RiMapPinLine />}
              iconBgClass="bg-secondary/20"
              iconTextClass="text-secondary"
              title="Location Focused"
              description="Find flatmates in your preferred neighborhoods with our location-based matching system."
            />
          </div>
        </Section>

        <Section title="Success Stories">
           <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <TestimonialCard
                name="Sarah Johnson"
                imageUrl="https://public.readdy.ai/ai/img_res/f0e189cb59a8e8d8b0025f976f271379.jpg"
                rating={5}
                text="I found my perfect flatmate in just a week! We've been living together for 6 months now and get along brilliantly."
              />
              <TestimonialCard
                name="Michael Chen"
                imageUrl="https://public.readdy.ai/ai/img_res/cfdb10f2226a4127353df815f7e42825.jpg"
                rating={4.5}
                text="Flattr made it so easy to find someone with similar interests and living habits. The matching algorithm really works!"
              />
           </div>
        </Section>

        <Section id="pricing" className="bg-base-200/50" title="Simple Pricing">
          <div className="flex justify-center">
             <PricingCard
                isPopular={true}
                planName="Premium Plan"
                price="£9.99"
                pricePeriod="/month"
                features={[
                  "Unlimited swipes & matches",
                  "Advanced filters & preferences",
                  "See who liked your profile",
                  "Priority customer support"
                ]}
                buttonText="Get Started"
                freePlanLink="#"
              />
          </div>
        </Section>

        <Section>
            <CtaCard
              title="Ready to Find Your Perfect Flatmate?"
              description="Join thousands of happy flatmates who found their perfect match on Flattr."
              buttonText="Create Your Profile"
              finePrint="No credit card required to sign up"
            />
        </Section>
      </main>

      <TabBar />
    </div>
  );
}