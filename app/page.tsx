export default function Home() {
  const services = [
    {
      title: "Bridal Makeup",
      detail: "Calm, camera-ready looks shaped around your outfit, jewelry, and ceremony light.",
    },
    {
      title: "Party Glam",
      detail: "Soft glam, shimmer, or sculpted finish for receptions, shoots, and special nights.",
    },
    {
      title: "Skin & Hair",
      detail: "Pre-event facials, styling, and finishing touches for a naturally polished glow.",
    },
  ];

  const moments = ["Bridal", "Engagement", "Reception", "Editorial", "Festive"];

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf6] font-sans text-stone-950">
      <section className="relative isolate min-h-screen px-5 py-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_18%,rgba(244,114,182,0.20),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(251,191,36,0.18),transparent_28%),linear-gradient(135deg,#fffaf6_0%,#fff1f2_48%,#f8f3ea_100%)]" />
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col">
          <header className="flex items-center justify-between gap-4">
            <a href="#top" className="text-xl font-semibold tracking-[0.18em] text-stone-950">
              NR
            </a>
            <nav className="hidden items-center gap-8 text-sm font-medium text-stone-700 md:flex">
              <a className="transition hover:text-rose-700" href="#services">
                Services
              </a>
              <a className="transition hover:text-rose-700" href="#work">
                Work
              </a>
              <a className="transition hover:text-rose-700" href="#contact">
                Contact
              </a>
            </nav>
            <a
              href="#contact"
              className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-900"
            >
              Book Now
            </a>
          </header>

          <div id="top" className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:py-10">
            <div className="max-w-3xl">
              <h1 className="text-balance text-5xl font-semibold leading-[0.96] text-stone-950 sm:text-7xl lg:text-8xl">
                Nikharta Roop
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-700 sm:text-xl">
                Refined makeup, hair, and skin styling for moments that deserve a graceful,
                luminous finish.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-full bg-rose-700 px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-lg shadow-rose-900/15 transition hover:bg-rose-800"
                >
                  Reserve Your Date
                </a>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white/50 px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-950 backdrop-blur transition hover:border-rose-300 hover:bg-white"
                >
                  Explore Services
                </a>
              </div>
            </div>

            <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px]">
              <div className="absolute inset-0 rotate-3 rounded-[2rem] bg-rose-200/60" />
              <div className="relative h-full rounded-[2rem] border border-white/80 bg-[linear-gradient(155deg,rgba(255,255,255,0.72),rgba(255,228,230,0.36)),url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center shadow-2xl shadow-rose-950/20">
                <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/60 bg-white/72 p-5 shadow-xl shadow-stone-950/10 backdrop-blur-md">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-800">
                    Signature Finish
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-stone-950">
                    Soft glow. Clean detail. Timeless photos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-white px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="max-w-2xl text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
              Beauty services designed around your day.
            </h2>
            <p className="max-w-md text-base leading-7 text-stone-600">
              Every look is planned with your skin, outfit, schedule, and comfort in mind.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {services.map((service) => (
              <article
                className="rounded-3xl border border-stone-200 bg-[#fffaf6] p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-950/10"
                key={service.title}
              >
                <h3 className="text-2xl font-semibold text-stone-950">{service.title}</h3>
                <p className="mt-4 text-base leading-7 text-stone-600">{service.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="bg-[#f8f3ea] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="text-4xl font-semibold leading-tight text-stone-950 sm:text-5xl">
              A polished look for every celebration.
            </h2>
            <p className="mt-5 text-lg leading-8 text-stone-700">
              From natural bridal glow to defined evening glam, Nikharta Roop keeps the finish
              elegant, wearable, and photo-friendly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {moments.map((moment) => (
                <span
                  className="rounded-full border border-stone-300 bg-white/70 px-4 py-2 text-sm font-semibold text-stone-700"
                  key={moment}
                >
                  {moment}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="min-h-72 rounded-[2rem] bg-[url('https://images.unsplash.com/photo-1595475884562-073c30d45670?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center shadow-xl shadow-stone-950/10" />
            <div className="mt-12 min-h-72 rounded-[2rem] bg-[url('https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center shadow-xl shadow-stone-950/10" />
          </div>
        </div>
      </section>

      <section id="contact" className="bg-stone-950 px-5 py-20 text-white sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Ready for your glow?
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-stone-300">
              Share your event date, location, and preferred style. We will help plan the right
              service for your occasion.
            </p>
          </div>
          <a
            href="mailto:hello@nikhartaroop.com"
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-stone-950 transition hover:bg-rose-100"
          >
            hello@nikhartaroop.com
          </a>
        </div>
      </section>
    </main>
  );
}
