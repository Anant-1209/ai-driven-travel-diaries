import { useEffect, useState } from 'react';

export const PARTNER_LABELS = {
  hotel: '🏨 Hotel',
  homestay: '🏡 Homestay',
  houseboat: '🛶 Houseboat',
  cab: '🚕 Cab / Taxi',
  bus: '🚌 Bus operator',
  guide: '🧭 Local guide',
};

const recordContact = (partnerId, channel) => {
  fetch(`/api/partner/${partnerId}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel }),
    keepalive: true,
  }).catch(() => {});
};

export default function LocalPartners({ placeSlug, placeName }) {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    fetch(`/api/partner?place=${encodeURIComponent(placeSlug)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setPartners)
      .catch(() => setPartners([]));
  }, [placeSlug]);

  if (partners.length === 0) return null;

  const greeting = (name) =>
    encodeURIComponent(`Hi ${name}, I found you on Travel Diaries and I'm planning a trip to ${placeName}.`);

  return (
    <section className='max-w-5xl mx-auto w-full px-3 my-10'>
      <p className='text-xs uppercase tracking-widest text-teal-600 font-semibold'>Trusted locals</p>
      <h2 className='text-2xl font-bold'>Stays, cabs and guides in {placeName}</h2>
      <p className='text-sm text-slate-500 mb-4'>
        Contact them directly. No booking fees. Verified partners were checked by our team.
      </p>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {partners.map((partner) => (
          <article
            key={partner._id}
            className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex flex-col'
          >
            {partner.image && <img src={partner.image} alt='' loading='lazy' className='w-full h-36 object-cover' />}
            <div className='p-4 flex flex-col flex-1'>
              <div className='flex items-start justify-between gap-2'>
                <h3 className='font-bold'>{partner.name}</h3>
                {partner.verified && (
                  <span className='text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0'>
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className='text-xs text-slate-500 mt-0.5'>
                {PARTNER_LABELS[partner.type]}
                {partner.priceRange && ` · ${partner.priceRange}`}
              </p>
              {partner.description && (
                <p className='text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-3'>{partner.description}</p>
              )}
              <div className='flex gap-2 mt-auto pt-4'>
                {partner.whatsapp && (
                  <a
                    href={`https://wa.me/${partner.whatsapp}?text=${greeting(partner.name)}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={() => recordContact(partner._id, 'whatsapp')}
                    className='flex-1 text-center px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold'
                  >
                    WhatsApp
                  </a>
                )}
                {partner.phone && (
                  <a
                    href={`tel:+${partner.phone}`}
                    onClick={() => recordContact(partner._id, 'call')}
                    className='flex-1 text-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700'
                  >
                    Call
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
