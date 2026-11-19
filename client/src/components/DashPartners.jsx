import { Alert, Button, Checkbox, Label, Select, Table, TextInput, Textarea } from 'flowbite-react';
import { useEffect, useState } from 'react';
import { PARTNER_LABELS } from './LocalPartners';
import { uploadMedia } from '../utils/uploadMedia';

const EMPTY_FORM = {
  name: '',
  type: 'homestay',
  placeSlugs: [],
  description: '',
  priceRange: '',
  phone: '',
  whatsapp: '',
  image: '',
  verified: false,
  active: true,
};

export default function DashPartners() {
  const [partners, setPartners] = useState([]);
  const [places, setPlaces] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/partner/admin')
      .then((res) => (res.ok ? res.json() : []))
      .then(setPartners)
      .catch(() => {});
    fetch('/api/post/getposts?limit=50')
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data) => setPlaces(data.posts.map(({ slug, title }) => ({ slug, title }))))
      .catch(() => {});
  }, []);

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const togglePlace = (slug) =>
    setForm((prev) => ({
      ...prev,
      placeSlugs: prev.placeSlugs.includes(slug)
        ? prev.placeSlugs.filter((s) => s !== slug)
        : [...prev.placeSlugs, slug],
    }));

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadMedia(file);
      setForm((prev) => ({ ...prev, image: url }));
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (partner) => {
    setEditingId(partner._id);
    setForm({ ...EMPTY_FORM, ...partner });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.placeSlugs.length === 0) {
      setError('Choose at least one destination.');
      return;
    }
    const body = Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, form[key]]));
    try {
      setSaving(true);
      const res = await fetch(editingId ? `/api/partner/${editingId}` : '/api/partner', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not save partner');
      setPartners((prev) => (editingId ? prev.map((p) => (p._id === editingId ? data : p)) : [data, ...prev]));
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partner) => {
    if (!window.confirm(`Delete ${partner.name}?`)) return;
    const res = await fetch(`/api/partner/${partner._id}`, { method: 'DELETE' });
    if (res.ok) setPartners((prev) => prev.filter((p) => p._id !== partner._id));
  };

  return (
    <div className='flex-1 p-4 max-w-6xl mx-auto w-full'>
      <h2 className='text-2xl font-bold mb-1'>Local partners</h2>
      <p className='text-sm text-slate-500 mb-6'>
        Hotels, homestays, houseboats, cabs, bus operators and guides shown on destination pages.
      </p>

      <form onSubmit={handleSubmit} className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-8'>
        <div>
          <Label value='Business name' />
          <TextInput required maxLength={100} value={form.name} onChange={setField('name')} />
        </div>
        <div>
          <Label value='Type' />
          <Select value={form.type} onChange={setField('type')}>
            {Object.entries(PARTNER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label value='WhatsApp number (with country code)' />
          <TextInput placeholder='+91 98765 43210' value={form.whatsapp} onChange={setField('whatsapp')} />
        </div>
        <div>
          <Label value='Phone number' />
          <TextInput placeholder='+91 98765 43210' value={form.phone} onChange={setField('phone')} />
        </div>
        <div>
          <Label value='Price range' />
          <TextInput placeholder='₹1,500–2,500 / night' maxLength={60} value={form.priceRange} onChange={setField('priceRange')} />
        </div>
        <div>
          <Label value='Photo' />
          <input type='file' accept='image/*' onChange={handleImage} className='text-sm block mt-2' />
          {form.image && <img src={form.image} alt='' className='mt-2 h-16 rounded-lg object-cover' />}
        </div>
        <div className='md:col-span-2'>
          <Label value='Description' />
          <Textarea rows={3} maxLength={1000} value={form.description} onChange={setField('description')} />
        </div>
        <div className='md:col-span-2'>
          <Label value='Destinations served' />
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-lg border-slate-200 dark:border-slate-700'>
            {places.map((place) => (
              <label key={place.slug} className='flex items-center gap-2 text-sm'>
                <Checkbox checked={form.placeSlugs.includes(place.slug)} onChange={() => togglePlace(place.slug)} />
                {place.title.split(':')[0]}
              </label>
            ))}
          </div>
        </div>
        <div className='flex gap-6 items-center'>
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox checked={form.verified} onChange={(e) => setForm((prev) => ({ ...prev, verified: e.target.checked }))} />
            Verified by our team
          </label>
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
            Show on site
          </label>
        </div>
        <div className='flex gap-2 md:justify-end'>
          {editingId && (
            <Button color='gray' type='button' onClick={resetForm}>
              Cancel
            </Button>
          )}
          <Button type='submit' gradientDuoTone='tealToLime' disabled={saving}>
            {editingId ? 'Save changes' : 'Add partner'}
          </Button>
        </div>
        {error && (
          <Alert color='failure' className='md:col-span-2'>
            {error}
          </Alert>
        )}
      </form>

      {partners.length === 0 ? (
        <p className='text-slate-500'>No partners yet. Add your first homestay, cab or guide above.</p>
      ) : (
        <div className='overflow-x-auto'>
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Type</Table.HeadCell>
              <Table.HeadCell>Destinations</Table.HeadCell>
              <Table.HeadCell>Verified</Table.HeadCell>
              <Table.HeadCell>On site</Table.HeadCell>
              <Table.HeadCell>Enquiries</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body className='divide-y'>
              {partners.map((partner) => (
                <Table.Row key={partner._id} className='bg-white dark:bg-gray-800'>
                  <Table.Cell className='font-semibold'>{partner.name}</Table.Cell>
                  <Table.Cell>{PARTNER_LABELS[partner.type]}</Table.Cell>
                  <Table.Cell className='text-xs'>{partner.placeSlugs.join(', ')}</Table.Cell>
                  <Table.Cell>{partner.verified ? '✓' : '—'}</Table.Cell>
                  <Table.Cell>{partner.active ? 'Yes' : 'Hidden'}</Table.Cell>
                  <Table.Cell>{partner.enquiries}</Table.Cell>
                  <Table.Cell className='flex gap-3'>
                    <button type='button' className='text-teal-600 hover:underline' onClick={() => startEdit(partner)}>
                      Edit
                    </button>
                    <button type='button' className='text-red-500 hover:underline' onClick={() => handleDelete(partner)}>
                      Delete
                    </button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
    </div>
  );
}
