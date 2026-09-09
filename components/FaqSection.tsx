"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Do I still have to attend my regular classes on September 1–2?",
    a: "For continuing/old students who are scheduled to take examinations on September 1–2, you are excused from your regular classes. Your absence will not be counted against you.",
  },
  {
    q: "What if I don't have an examination on September 1–2?",
    a: "If you are not scheduled for an examination, please follow your regular class schedule and the instructions of your respective faculty members.",
  },
  {
    q: "Where can I find my examination schedule and room assignment?",
    a: "Your examination schedule and room assignment will be provided by the faculty member handling the subject and made available through your respective College.",
  },
  {
    q: "Will attendance be checked on September 1–2?",
    a: "Regular attendance checking and recording will officially begin on September 7, 2026. However, students should still follow the arrangements and instructions provided by their respective faculty members.",
  },
  {
    q: "Are examinations on September 1–2 part of the previous term?",
    a: "Yes. These examinations are for continuing/old students who still need to complete examinations from the previous term.",
  },
  {
    q: "Will regular classes continue on September 1–2?",
    a: "Yes, regular classes are part of the opening of SY 2026–2027. However, students who are scheduled for examinations on September 1–2 are excused from their regular classes during the examination arrangements.",
  },
  {
    q: "What about new/first-year students?",
    a: "For new students, the Welcoming Rites will be scheduled on a later date. In the meantime, faculty members are encouraged to use class time for classroom orientation and discussion of relevant University policies and guidelines.",
  },
  {
    q: "Is wearing the uniform required during the first week?",
    a: "For 2nd year students and above: the prescribed university uniform is required; however, consideration is being given during the first week of classes. For 1st year students: wearing the prescribed university uniform is highly encouraged.",
  },
  {
    q: "How do I read my room assignment?",
    a: "Room codes indicate the building, floor, and room number. Example: LSB 701 — LSB (Life and Science Building), 7 (7th Floor), 01 (Room 1).",
  },
  {
    q: "What if I am still affected by flooding and genuinely cannot travel to the University?",
    a: "Please coordinate with your respective professor and explain your situation — they may provide appropriate consideration. Communicate your concerns as soon as possible, and please prioritize your safety.",
  },
  {
    q: "When will the Frosh Walk and Frosh Night be held?",
    a: "The official dates will be announced through the official Facebook page of the University Student Council. In the meantime, the Lasallian Kickoff will be held on September 1 as a mini welcoming activity.",
  },
];

export default function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="faqs" className="border-t border-zinc-200 bg-zinc-50/60">
      <div className="mx-auto max-w-[900px] px-5 sm:px-6 py-16 sm:py-28">
        <div className="mb-10 sm:mb-14 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 sm:w-10 bg-green-600" />
            <p className="font-mono text-[11px] sm:text-sm tracking-[0.25em] sm:tracking-[0.3em] text-green-700 uppercase font-semibold">
              SY 2026–2027 Opening
            </p>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight">
            Frequently asked questions
          </h2>
          <p className="text-zinc-600 text-base sm:text-lg leading-relaxed max-w-[560px]">
            Answers about the September 1–2 examination arrangements, uniforms,
            attendance, and welcoming activities for the new school year.
          </p>
        </div>

        <div className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
          {faqs.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                  className="w-full flex items-start justify-between gap-4 sm:gap-6 py-5 sm:py-6 text-left"
                >
                  <span className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">{item.q}</span>
                  <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-0.5 shrink-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-green-50 text-green-700"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 sm:pb-6 pr-10 sm:pr-14 text-sm sm:text-base text-zinc-600 leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <p className="mt-8 sm:mt-10 text-sm text-zinc-500">
          Didn&apos;t find what you&apos;re looking for? Watch the official
          Facebook page of the University Student Council for further announcements.
        </p>
      </div>
    </section>
  );
}