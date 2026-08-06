"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type LogoFile = {
  name: string;
  url: string;
};

export default function Footer() {
  const [logos, setLogos] = useState<LogoFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogos = async () => {
      const { data, error } = await supabase.storage.from("logo").list("", {
        sortBy: { column: "name", order: "asc" },
      });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const files = data
        .filter((f) => f.name && !f.name.startsWith(".")) // skip placeholder/hidden files
        .map((f) => {
          const { data: urlData } = supabase.storage
            .from("logo")
            .getPublicUrl(f.name);
          return { name: f.name, url: urlData.publicUrl };
        });

      setLogos(files);
      setLoading(false);
    };

    loadLogos();
  }, []);

  // Pull out the school (dlsau) and usc logos to center them;
  // everything else (colleges) splits left/right around them.
  const dlsauLogo = logos.find((l) => l.name.toLowerCase().includes("dlsau"));
  const uscLogo = logos.find((l) => l.name.toLowerCase().includes("usc"));
  const collegeLogos = logos.filter(
    (l) => l !== dlsauLogo && l !== uscLogo
  );
  const half = Math.ceil(collegeLogos.length / 2);
  const leftColleges = collegeLogos.slice(0, half);
  const rightColleges = collegeLogos.slice(half);

  return (
    <footer
      className="text-zinc-300 pt-16 pb-8 px-6 relative overflow-hidden"
      style={{ backgroundColor: "#032602" }}
    >
      {/* Decorative top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>

      <div className="max-w-[1200px] mx-auto">
        
        {/* --- LOGO SECTION --- */}
        {!loading && logos.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-12 pb-12 border-b border-white/10">
            
            {leftColleges.map((logo) => (
              <img
                key={logo.name}
                src={logo.url}
                alt={logo.name.replace(/\.[^/.]+$/, "")}
                draggable={false}
                className="h-10 md:h-14 w-auto object-contain opacity-80 pointer-events-none select-none"
              />
            ))}

            {(dlsauLogo || uscLogo) && (
              <div className="flex items-center gap-2 md:gap-4 mx-4 md:mx-8">
                {dlsauLogo && (
                  <img
                    src={dlsauLogo.url}
                    alt="DLSAU"
                    draggable={false}
                    className="h-16 md:h-24 w-auto object-contain pointer-events-none select-none drop-shadow-md"
                  />
                )}
                {uscLogo && (
                  <img
                    src={uscLogo.url}
                    alt="USC"
                    draggable={false}
                    className="h-16 md:h-24 w-auto object-contain pointer-events-none select-none drop-shadow-md"
                  />
                )}
              </div>
            )}

            {rightColleges.map((logo) => (
              <img
                key={logo.name}
                src={logo.url}
                alt={logo.name.replace(/\.[^/.]+$/, "")}
                draggable={false}
                className="h-10 md:h-14 w-auto object-contain opacity-80 pointer-events-none select-none"
              />
            ))}
          </div>
        )}

        {/* --- FOOTER DETAILS SECTION --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12 text-sm text-center md:text-left">
          
          {/* Column 1: About */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wider uppercase">
              University Student Council
            </h3>
            <p className="text-zinc-400 leading-relaxed max-w-sm mx-auto md:mx-0">
              The highest governing student body of De La Salle Araneta University, 
              dedicated to serving the Lasallian community with integrity, purpose, 
              and excellence since its establishment.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wider uppercase">
              Quick Links
            </h3>
            <ul className="flex flex-col space-y-3 text-zinc-400">
              <li>
                <a 
                  href="https://www.dlsau.edu.ph/intranet/downloads/handbooks/DLSAU-TED-Student-Handbook-2026.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white hover:underline underline-offset-4 transition-all"
                >
                  Student Handbooks (2026-2027)
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white hover:underline underline-offset-4 transition-all">
                  Council Resolutions
                </a>
              </li>
              <li>
                <a 
                  href="https://www.dlsau.edu.ph/about/calendar/downloads/TED-Calendar-2026-2027.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white hover:underline underline-offset-4 transition-all"
                >
                  Campus Events & Calendar (2026-2027)
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white hover:underline underline-offset-4 transition-all">
                  Feedback & Concerns
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Socials */}
          <div>
            <h3 className="text-white font-bold text-base mb-4 tracking-wider uppercase">
              Connect With Us
            </h3>
            <p className="text-zinc-400 mb-4 leading-relaxed">
              Victoneta Ave, Potrero, <br />
              Malabon, Metro Manila, Philippines
            </p>
            <div className="flex justify-center md:justify-start gap-4">
              {/* Facebook Icon */}
              <a 
                href="https://www.facebook.com/DLSAUSC" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-400 hover:text-white transition-colors" 
                aria-label="Facebook"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              {/* Twitter/X Icon (Kept as placeholder) */}

              {/* Instagram Icon */}
              <a 
                href="https://www.instagram.com/usc_dlsau/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-zinc-400 hover:text-white transition-colors" 
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* --- COPYRIGHT SECTION --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 text-xs">
          <p className="font-medium text-zinc-300">
            © {new Date().getFullYear()} DLSAU University Student Council. All rights reserved.
          </p>
          <div className="flex gap-4">
            <p className="text-zinc-400">Built for the DLSAU student community.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}