/**
 * Dashboard Page Component
 * Real-time dashboard for agent/client/admin workflows
 */
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { StatCard, ChartCard, SimpleBarChart, SimpleLineChart, SimplePieChart } from '../components/DashboardWidgets';
import api, { ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  getProperties as getPropertiesFromApi,
  createProperty as createPropertyApi,
  updateProperty as updatePropertyApi,
  deleteProperty as deletePropertyApi,
  uploadPropertyImages as uploadPropertyImagesApi
} from '../services/propertyService';
import { getTransactions as getTransactionsApi, exportTransactions as exportTransactionsApi } from '../services/transactionService';
import {
  Grid3x3Gap,
  Building,
  CashCoin,
  PlusCircle,
  PencilSquare,
  Trash,
  Eye,
  FileText,
  Gear,
  List,
  X,
  PersonCircle,
  ArrowClockwise,
  Download,
  GraphUp,
  ClockHistory
} from 'react-bootstrap-icons';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=160&q=80';
const PROPERTY_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='140'><rect width='100%' height='100%' fill='#e2e8f0'/><text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' fill='#64748b' font-size='14' font-family='Arial'>No image uploaded</text></svg>"
)}`;

const EMPTY_PROPERTY_FORM = {
  title: '',
  propertyType: 'house',
  listingType: 'sale',
  price: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  parking: '',
  address: '',
  city: '',
  state: '',
  description: ''
};

const normalizeTransaction = (transaction) => ({
  id: transaction.id || transaction._id,
  property: transaction.property?.title || 'Property Request',
  client: transaction.client?.name || 'Client',
  type: (transaction.transaction_type || 'sale').toLowerCase(),
  amount: Number(transaction.amount || 0),
  createdAt: transaction.created_at || transaction.updated_at,
  status: (transaction.status || 'pending').toLowerCase()
});

const normalizeProperty = (property) => {
  const address = property.address || {};
  const features = property.features || {};
  return {
    id: property.id || property._id,
    title: property.title || 'Untitled Property',
    location: [address.street, address.city, address.state].filter(Boolean).join(', '),
    price: Number(property.price || 0),
    status: property.status || 'available',
    views: Number(property.views || 0),
    thumbnail: property.images?.[0] || '',
    images: property.images || [],
    propertyType: property.property_type || 'house',
    listingType: property.listing_type || 'sale',
    description: property.description || '',
    address: { street: address.street || '', city: address.city || '', state: address.state || '' },
    features: {
      area: Number(features.area || 0),
      bedrooms: Number(features.bedrooms || 0),
      bathrooms: Number(features.bathrooms || 0),
      parking: Number(features.parking || 0)
    }
  };
};

const formatCurrency = (value, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0));

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const getStatusClass = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (['available', 'active', 'completed'].includes(normalized)) return 'active';
  if (['pending', 'in_progress'].includes(normalized)) return 'pending';
  if (['sold', 'rented'].includes(normalized)) return 'sold';
  if (['cancelled', 'inactive'].includes(normalized)) return 'cancelled';
  return 'active';
};

const getGrowthChange = (value) => {
  if (!Number.isFinite(value)) return null;
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function DashboardHome({
  overview,
  revenueAnalytics,
  propertyAnalytics,
  performance,
  activity,
  recentTransactions,
  loading,
  onRefresh,
  onAddProperty,
  canManageProperties
}) {
  const monthlySalesData = useMemo(() => {
    const monthly = revenueAnalytics?.monthly || [];
    const mapped = monthly.slice(-6).map((item) => ({
      label: item.month?.split(' ')[0] || 'Month',
      value: Number(item.transactions || 0) || 1
    }));
    return mapped.length > 0 ? mapped : [{ label: 'No Data', value: 1 }];
  }, [revenueAnalytics]);

  const revenueTrendData = useMemo(() => {
    const monthly = revenueAnalytics?.monthly || [];
    const mapped = monthly.slice(-6).map((item) => ({
      label: item.month?.split(' ')[0] || 'Month',
      value: Number(item.revenue || 0) || 1
    }));
    return mapped.length > 0 ? mapped : [{ label: 'No Data', value: 1 }];
  }, [revenueAnalytics]);

  const propertyTypeData = useMemo(() => {
    const byType = propertyAnalytics?.by_type || [];
    const mapped = byType
      .filter((item) => item._id)
      .map((item) => ({
        label: String(item._id).charAt(0).toUpperCase() + String(item._id).slice(1),
        value: Number(item.count || 0) || 1
      }));
    return mapped.length > 0 ? mapped : [{ label: 'No Data', value: 1 }];
  }, [propertyAnalytics]);

  const revenueGrowth = performance?.growth?.revenue;
  const transactionGrowth = performance?.growth?.transactions;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Dashboard Overview</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-gold" onClick={() => onRefresh(false)} disabled={loading}>
            <ArrowClockwise className="me-2" /> Refresh
          </button>
          {canManageProperties && (
            <button className="btn btn-primary-custom" onClick={onAddProperty}>
              <PlusCircle className="me-2" /> Add Property
            </button>
          )}
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <StatCard title="Total Properties" value={overview?.properties?.total || 0} icon={Building} color="blue" />
        </div>
        <div className="col-lg-3 col-md-6">
          <StatCard
            title="Completed Deals"
            value={overview?.transactions?.completed || 0}
            icon={GraphUp}
            color="green"
            change={getGrowthChange(transactionGrowth)}
            changeType={(transactionGrowth || 0) >= 0 ? 'positive' : 'negative'}
          />
        </div>
        <div className="col-lg-3 col-md-6">
          <StatCard title="Pending Deals" value={overview?.transactions?.pending || 0} icon={ClockHistory} color="gold" />
        </div>
        <div className="col-lg-3 col-md-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(overview?.revenue?.total || 0)}
            icon={CashCoin}
            color="red"
            change={getGrowthChange(revenueGrowth)}
            changeType={(revenueGrowth || 0) >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <ChartCard title="Monthly Deals">
            <SimpleBarChart data={monthlySalesData} />
          </ChartCard>
        </div>
        <div className="col-lg-4">
          <ChartCard title="Property Types">
            <SimplePieChart data={propertyTypeData} />
          </ChartCard>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12">
          <ChartCard title="Revenue Trend">
            <SimpleLineChart data={revenueTrendData} />
          </ChartCard>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="dashboard-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="mb-0">Recent Transactions</h4>
              <span className="text-muted small">{recentTransactions.length} records</span>
            </div>
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-muted text-center py-4">
                        No recent transactions yet.
                      </td>
                    </tr>
                  )}
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.property}</td>
                      <td>{transaction.client}</td>
                      <td className="text-capitalize">{transaction.type}</td>
                      <td>{formatCurrency(transaction.amount)}</td>
                      <td>{formatDateTime(transaction.createdAt)}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(transaction.status)}`}>{transaction.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="dashboard-card">
            <h4 className="mb-3">Recent Activity</h4>
            <div className="d-flex flex-column gap-3">
              {(activity || []).length === 0 && <p className="text-muted mb-0">No activity yet.</p>}
              {(activity || []).slice(0, 6).map((item) => (
                <div key={`${item.type}-${item.timestamp}-${item.title}`} className="border rounded p-2">
                  <div className="fw-semibold">{item.title}</div>
                  <small className="text-muted">{formatDateTime(item.timestamp)}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertiesManagement({ canManageProperties }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [submittingProperty, setSubmittingProperty] = useState(false);
  const [propertyError, setPropertyError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [propertyForm, setPropertyForm] = useState(EMPTY_PROPERTY_FORM);

  const updateFormField = (key, value) => {
    setPropertyForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetModalState = () => {
    setEditingProperty(null);
    setPropertyForm(EMPTY_PROPERTY_FORM);
    setPropertyError('');
    setSelectedFiles([]);
    setImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
  };

  const closeModal = () => {
    setShowModal(false);
    resetModalState();
  };

  const loadProperties = useCallback(async () => {
    if (!canManageProperties) {
      setLoadingProperties(false);
      return;
    }

    setLoadingProperties(true);
    setPropertyError('');
    try {
      const response = await getPropertiesFromApi({
        limit: 200,
        status: 'all',
        sort_by: 'created_at',
        sort_order: 'desc'
      });
      const apiProperties = response?.data?.properties || [];
      setProperties(apiProperties.map(normalizeProperty));
    } catch (error) {
      setPropertyError(error.message || 'Failed to load properties.');
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  }, [canManageProperties]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const openCreateModal = () => {
    resetModalState();
    setShowModal(true);
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setPropertyForm({
      title: property.title || '',
      propertyType: property.propertyType || 'house',
      listingType: property.listingType || 'sale',
      price: property.price || '',
      area: property.features?.area || '',
      bedrooms: property.features?.bedrooms || '',
      bathrooms: property.features?.bathrooms || '',
      parking: property.features?.parking || '',
      address: property.address?.street || '',
      city: property.address?.city || '',
      state: property.address?.state || '',
      description: property.description || ''
    });
    setPropertyError('');
    setShowModal(true);
  };

  const handleImageSelection = (event) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return files.map((file) => URL.createObjectURL(file));
    });
  };

  const handleAddOrUpdateProperty = async (event) => {
    event.preventDefault();
    setSubmittingProperty(true);
    setPropertyError('');

    try {
      const payload = {
        title: propertyForm.title.trim(),
        property_type: propertyForm.propertyType.trim(),
        listing_type: propertyForm.listingType.trim(),
        price: Number(propertyForm.price || 0),
        description: propertyForm.description.trim(),
        address: {
          street: propertyForm.address.trim(),
          city: propertyForm.city.trim(),
          state: propertyForm.state.trim(),
          country: 'Nigeria'
        },
        features: {
          area: Number(propertyForm.area || 0),
          bedrooms: Number(propertyForm.bedrooms || 0),
          bathrooms: Number(propertyForm.bathrooms || 0),
          parking: Number(propertyForm.parking || 0)
        }
      };

      if (!payload.title || !payload.property_type || !payload.listing_type || !payload.price) {
        setPropertyError('Title, property type, listing type, and price are required.');
        return;
      }

      const response = editingProperty
        ? await updatePropertyApi(editingProperty.id, payload)
        : await createPropertyApi(payload);

      if (!response?.success) {
        setPropertyError(response?.message || 'Failed to save property.');
        return;
      }

      const propertyId = response?.data?.id || response?.data?._id || editingProperty?.id;
      if (propertyId && selectedFiles.length > 0) {
        const uploadFormData = new FormData();
        selectedFiles.forEach((file) => uploadFormData.append('images', file));
        await uploadPropertyImagesApi(propertyId, uploadFormData);
      }

      closeModal();
      await loadProperties();
    } catch (error) {
      setPropertyError(error.message || 'Failed to save property.');
    } finally {
      setSubmittingProperty(false);
    }
  };

  const handleDeleteProperty = async (property) => {
    const shouldDelete = window.confirm(`Delete "${property.title}"? This action cannot be undone.`);
    if (!shouldDelete) return;

    try {
      const response = await deletePropertyApi(property.id);
      if (!response?.success) {
        alert(response?.message || 'Could not delete property.');
        return;
      }
      await loadProperties();
    } catch (error) {
      alert(error.message || 'Could not delete property.');
    }
  };

  if (!canManageProperties) {
    return (
      <div className="dashboard-card">
        <h4 className="mb-2">Property Management</h4>
        <p className="text-muted mb-0">Property management is available for agent and admin accounts.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Property Management</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-gold" onClick={loadProperties} disabled={loadingProperties}>
            <ArrowClockwise className="me-2" /> Refresh
          </button>
          <button className="btn btn-primary-custom" onClick={openCreateModal}>
            <PlusCircle className="me-2" /> Add Property
          </button>
        </div>
      </div>

      {propertyError && <div className="alert alert-danger">{propertyError}</div>}

      <div className="dashboard-card">
        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Location</th>
                <th>Price</th>
                <th>Views</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loadingProperties && properties.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    No properties found.
                  </td>
                </tr>
              )}
              {properties.map((property) => (
                <tr key={property.id}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <img
                        src={property.thumbnail || PROPERTY_PLACEHOLDER}
                        alt={property.title}
                        style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <div>
                        <strong>{property.title}</strong>
                        <div className="small text-muted text-capitalize">
                          {property.propertyType} ({property.listingType})
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{property.location || 'N/A'}</td>
                  <td>{formatCurrency(property.price)}</td>
                  <td>{property.views}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(property.status)}`}>{property.status}</span>
                  </td>
                  <td>
                    <button className="action-btn view" title="View" onClick={() => navigate(`/properties/${property.id}`)}>
                      <Eye size={16} />
                    </button>
                    <button className="action-btn edit" title="Edit" onClick={() => openEditModal(property)}>
                      <PencilSquare size={16} />
                    </button>
                    <button className="action-btn delete" title="Delete" onClick={() => handleDeleteProperty(property)}>
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay active" onClick={closeModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h5 className="modal-title">{editingProperty ? 'Edit Property' : 'Add New Property'}</h5>
              <button className="modal-close" onClick={closeModal}>
                <X />
              </button>
            </div>
            <div className="modal-body">
              <form id="property-form" onSubmit={handleAddOrUpdateProperty}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Property Title</label>
                    <input type="text" className="form-control-custom" value={propertyForm.title} onChange={(e) => updateFormField('title', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Property Type</label>
                    <select className="form-control-custom" value={propertyForm.propertyType} onChange={(e) => updateFormField('propertyType', e.target.value)}>
                      <option value="house">House</option>
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="condo">Condo</option>
                      <option value="commercial">Commercial</option>
                      <option value="land">Land</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Listing Type</label>
                    <select className="form-control-custom" value={propertyForm.listingType} onChange={(e) => updateFormField('listingType', e.target.value)}>
                      <option value="sale">For Sale</option>
                      <option value="rent">For Rent</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Price</label>
                    <input type="number" className="form-control-custom" value={propertyForm.price} onChange={(e) => updateFormField('price', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Area (sqft)</label>
                    <input type="number" className="form-control-custom" value={propertyForm.area} onChange={(e) => updateFormField('area', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Bedrooms</label>
                    <input type="number" className="form-control-custom" value={propertyForm.bedrooms} onChange={(e) => updateFormField('bedrooms', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Bathrooms</label>
                    <input type="number" className="form-control-custom" value={propertyForm.bathrooms} onChange={(e) => updateFormField('bathrooms', e.target.value)} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Parking</label>
                    <input type="number" className="form-control-custom" value={propertyForm.parking} onChange={(e) => updateFormField('parking', e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address</label>
                    <input type="text" className="form-control-custom" value={propertyForm.address} onChange={(e) => updateFormField('address', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">City</label>
                    <input type="text" className="form-control-custom" value={propertyForm.city} onChange={(e) => updateFormField('city', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">State</label>
                    <input type="text" className="form-control-custom" value={propertyForm.state} onChange={(e) => updateFormField('state', e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control-custom" rows="4" value={propertyForm.description} onChange={(e) => updateFormField('description', e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Property Images</label>
                    <input type="file" className="form-control-custom" multiple accept="image/*" onChange={handleImageSelection} />
                    {imagePreviews.length > 0 && (
                      <div className="d-flex gap-2 flex-wrap mt-2">
                        {imagePreviews.map((preview, index) => (
                          <img key={`${preview}-${index}`} src={preview} alt={`Upload Preview ${index + 1}`} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn btn-primary-custom" type="submit" form="property-form" disabled={submittingProperty}>
                {submittingProperty ? 'Saving...' : editingProperty ? 'Update Property' : 'Add Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionsManagement() {
  const [filters, setFilters] = useState({
    transaction_type: '',
    status: '',
    start_date: '',
    end_date: ''
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getTransactionsApi({
        ...filters,
        limit: 200
      });
      const records = response?.data?.transactions || [];
      setTransactions(records.map(normalizeTransaction));
    } catch (loadError) {
      setError(loadError.message || 'Failed to load transactions.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Transaction History</h2>
        <button className="btn btn-outline-gold" onClick={loadTransactions} disabled={loading}>
          <ArrowClockwise className="me-2" /> Refresh
        </button>
      </div>

      <div className="dashboard-card mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">Type</label>
            <select className="form-control-custom" value={filters.transaction_type} onChange={(e) => setFilters((prev) => ({ ...prev, transaction_type: e.target.value }))}>
              <option value="">All Types</option>
              <option value="sale">Sales</option>
              <option value="rent">Rentals</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select className="form-control-custom" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">From</label>
            <input type="date" className="form-control-custom" value={filters.start_date} onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))} />
          </div>
          <div className="col-md-3">
            <label className="form-label">To</label>
            <input type="date" className="form-control-custom" value={filters.end_date} onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))} />
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="dashboard-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Results</h5>
          <span className="text-muted small">{transactions.length} transaction(s)</span>
        </div>
        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Property</th>
                <th>Client</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    No transactions match this filter.
                  </td>
                </tr>
              )}
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>#{String(transaction.id).slice(-6)}</td>
                  <td>{transaction.property}</td>
                  <td>{transaction.client}</td>
                  <td className="text-capitalize">{transaction.type}</td>
                  <td>
                    <strong>{formatCurrency(transaction.amount)}</strong>
                  </td>
                  <td>{formatDateTime(transaction.createdAt)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(transaction.status)}`}>{transaction.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsManagement({ overview, revenueAnalytics, propertyAnalytics, performanceAnalytics, loading, onRefresh }) {
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState('');

  const salesPerformanceData = useMemo(() => {
    const monthly = revenueAnalytics?.monthly || [];
    const mapped = monthly.slice(-6).map((item) => ({
      label: item.month?.split(' ')[0] || 'Month',
      value: Number(item.transactions || 0) || 1
    }));
    return mapped.length > 0 ? mapped : [{ label: 'No Data', value: 1 }];
  }, [revenueAnalytics]);

  const revenueGrowthData = useMemo(() => {
    const monthly = revenueAnalytics?.monthly || [];
    const mapped = monthly.slice(-6).map((item) => ({
      label: item.month?.split(' ')[0] || 'Month',
      value: Number(item.revenue || 0) || 1
    }));
    return mapped.length > 0 ? mapped : [{ label: 'No Data', value: 1 }];
  }, [revenueAnalytics]);

  const propertyDistributionData = useMemo(() => {
    const byType = propertyAnalytics?.by_type || [];
    const mapped = byType
      .filter((item) => item._id)
      .map((item) => ({
        label: String(item._id).charAt(0).toUpperCase() + String(item._id).slice(1),
        value: Number(item.count || 0) || 1
      }));
    return mapped.length > 0 ? mapped : [{ label: 'No Data', value: 1 }];
  }, [propertyAnalytics]);

  const handleExport = async (format) => {
    setExporting(format);
    setExportError('');

    try {
      const backendFormat = format === 'document' ? 'doc' : 'pdf';
      const fileExtension = format === 'document' ? 'doc' : 'pdf';
      const blob = await exportTransactionsApi({}, backendFormat);

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error.message || 'Failed to export report.');
    } finally {
      setExporting('');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Reports &amp; Analytics</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-gold" onClick={() => onRefresh(false)} disabled={loading}>
            <ArrowClockwise className="me-2" /> Refresh
          </button>
          <button className="btn btn-outline-secondary" onClick={() => handleExport('pdf')} disabled={Boolean(exporting)}>
            <Download className="me-2" /> {exporting === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
          </button>
          <button className="btn btn-outline-gold" onClick={() => handleExport('document')} disabled={Boolean(exporting)}>
            <FileText className="me-2" /> {exporting === 'document' ? 'Exporting...' : 'Export Document'}
          </button>
        </div>
      </div>

      {exportError && <div className="alert alert-danger">{exportError}</div>}

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <ChartCard title="Sales Performance">
            <SimpleBarChart data={salesPerformanceData} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="Revenue Growth">
            <SimpleLineChart data={revenueGrowthData} />
          </ChartCard>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <ChartCard title="Property Distribution">
            <SimplePieChart data={propertyDistributionData} />
          </ChartCard>
        </div>
        <div className="col-lg-8">
          <div className="dashboard-card h-100">
            <h4 className="mb-4">Key Metrics</h4>
            <div className="row g-4">
              <div className="col-md-4">
                <div className="p-3 bg-light rounded h-100">
                  <h6 className="text-muted mb-2">Avg. Deal Size</h6>
                  <h4 className="mb-0 text-primary">{formatCurrency(performanceAnalytics?.metrics?.avg_deal_size || 0)}</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded h-100">
                  <h6 className="text-muted mb-2">Avg. Days to Close</h6>
                  <h4 className="mb-0 text-primary">{performanceAnalytics?.metrics?.avg_close_time_days || 0} days</h4>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-light rounded h-100">
                  <h6 className="text-muted mb-2">Conversion Rate</h6>
                  <h4 className="mb-0 text-primary">{performanceAnalytics?.metrics?.conversion_rate || 0}%</h4>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 bg-light rounded h-100">
                  <h6 className="text-muted mb-2">This Month Revenue</h6>
                  <h4 className="mb-0 text-primary">{formatCurrency(performanceAnalytics?.this_month?.revenue || 0)}</h4>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 bg-light rounded h-100">
                  <h6 className="text-muted mb-2">Total Revenue</h6>
                  <h4 className="mb-0 text-primary">{formatCurrency(overview?.revenue?.total || 0)}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsManagement({ user, onUpdateProfile, onChangePassword }) {
  const [settings, setSettings] = useState({
    timezone: 'Africa/Lagos',
    language: 'en',
    currency: 'NGN',
    dashboard_refresh_interval: 30,
    notifications_email: true,
    notifications_sms: false
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const preferences = user?.preferences || {};
    setSettings((prev) => ({
      ...prev,
      ...preferences,
      dashboard_refresh_interval: Number(preferences.dashboard_refresh_interval || prev.dashboard_refresh_interval)
    }));
  }, [user]);

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const result = await onUpdateProfile({
        preferences: {
          ...(user?.preferences || {}),
          ...settings,
          dashboard_refresh_interval: Number(settings.dashboard_refresh_interval || 30)
        }
      });
      if (!result?.success) {
        setError(result?.message || 'Failed to save settings.');
        return;
      }
      setMessage('Settings saved successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setChangingPassword(true);
    setMessage('');
    setError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError('Current and new password are required.');
      setChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match.');
      setChangingPassword(false);
      return;
    }

    const result = await onChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (!result?.success) {
      setError(result?.message || 'Failed to change password.');
      setChangingPassword(false);
      return;
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setMessage('Password changed successfully.');
    setChangingPassword(false);
  };

  return (
    <div>
      <h2 className="mb-4">Settings</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="dashboard-card">
            <h4 className="mb-3">System Preferences</h4>
            <form onSubmit={handleSaveSettings}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Timezone</label>
                  <select className="form-control-custom" value={settings.timezone} onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}>
                    <option value="Africa/Lagos">Africa/Lagos</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Currency</label>
                  <select className="form-control-custom" value={settings.currency} onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value }))}>
                    <option value="NGN">NGN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Language</label>
                  <select className="form-control-custom" value={settings.language} onChange={(e) => setSettings((prev) => ({ ...prev, language: e.target.value }))}>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Dashboard Refresh (seconds)</label>
                  <input type="number" className="form-control-custom" min="10" value={settings.dashboard_refresh_interval} onChange={(e) => setSettings((prev) => ({ ...prev, dashboard_refresh_interval: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="d-flex align-items-center gap-2">
                    <input type="checkbox" checked={Boolean(settings.notifications_email)} onChange={(e) => setSettings((prev) => ({ ...prev, notifications_email: e.target.checked }))} />
                    Email Notifications
                  </label>
                </div>
                <div className="col-md-6">
                  <label className="d-flex align-items-center gap-2">
                    <input type="checkbox" checked={Boolean(settings.notifications_sms)} onChange={(e) => setSettings((prev) => ({ ...prev, notifications_sms: e.target.checked }))} />
                    SMS Notifications
                  </label>
                </div>
              </div>
              <button className="btn btn-primary-custom mt-3" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="dashboard-card">
            <h4 className="mb-3">Account Security</h4>
            <form onSubmit={handlePasswordChange}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-control-custom" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control-custom" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-control-custom" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
              </div>
              <button className="btn btn-outline-gold" type="submit" disabled={changingPassword}>
                {changingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileManagement({ user, onUpdateProfile }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    avatar: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      phone: user?.phone || '',
      avatar: user?.avatar || ''
    });
  }, [user]);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image must be 5MB or smaller.');
      return;
    }
    setError('');
    const dataUrl = await fileToDataUrl(file);
    setFormData((prev) => ({ ...prev, avatar: dataUrl }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    const result = await onUpdateProfile({
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      phone: formData.phone.trim(),
      avatar: formData.avatar
    });
    if (!result?.success) {
      setError(result?.message || 'Failed to update profile.');
      setSaving(false);
      return;
    }
    setMessage('Profile updated successfully.');
    setSaving(false);
  };

  return (
    <div>
      <h2 className="mb-4">Profile</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="dashboard-card">
        <form onSubmit={handleProfileSave}>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="text-center">
                <img src={formData.avatar || DEFAULT_AVATAR} alt="Profile" className="rounded-circle mb-3" style={{ width: '140px', height: '140px', objectFit: 'cover', border: '4px solid #e2e8f0' }} />
                <input type="file" className="form-control-custom" accept="image/*" onChange={handleAvatarChange} />
              </div>
            </div>
            <div className="col-md-8">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-control-custom" value={formData.first_name} onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-control-custom" value={formData.last_name} onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))} />
                </div>
                <div className="col-12">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control-custom" value={user?.email || ''} disabled />
                </div>
                <div className="col-12">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control-custom" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
                </div>
              </div>
              <button className="btn btn-primary-custom mt-4" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  const navigate = useNavigate();
  const { user: authUser, updateProfile, changePassword } = useAuth();
  const currentUser = authUser || user;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [overviewData, setOverviewData] = useState({});
  const [revenueAnalytics, setRevenueAnalytics] = useState({});
  const [propertyAnalytics, setPropertyAnalytics] = useState({});
  const [performanceAnalytics, setPerformanceAnalytics] = useState({});
  const [activityFeed, setActivityFeed] = useState([]);

  const canManageProperties = ['admin', 'agent'].includes(currentUser?.role);
  const dashboardRefreshInterval = Number(currentUser?.preferences?.dashboard_refresh_interval || 30) * 1000;

  const displayName = currentUser
    ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email || 'User'
    : 'User';
  const displayRole = currentUser?.role || 'client';

  const fetchDashboardData = useCallback(
    async (silent = false) => {
      if (!currentUser?.id) return;
      if (!silent) setDashboardLoading(true);
      setDashboardError('');

      const requests = await Promise.allSettled([
        api.get(ENDPOINTS.DASHBOARD.OVERVIEW),
        api.get(ENDPOINTS.DASHBOARD.REVENUE),
        api.get(ENDPOINTS.DASHBOARD.PROPERTIES),
        api.get(ENDPOINTS.DASHBOARD.PERFORMANCE),
        api.get(`${ENDPOINTS.DASHBOARD.ACTIVITY}?limit=20`)
      ]);

      const hasAnySuccess = requests.some((result) => result.status === 'fulfilled' && result.value?.success);
      if (!hasAnySuccess) {
        setDashboardError('Could not load dashboard data. Please refresh.');
      }

      const [overviewResult, revenueResult, propertyResult, performanceResult, activityResult] = requests;
      if (overviewResult.status === 'fulfilled' && overviewResult.value?.success) {
        setOverviewData(overviewResult.value.data || {});
      }
      if (revenueResult.status === 'fulfilled' && revenueResult.value?.success) {
        setRevenueAnalytics(revenueResult.value.data || {});
      }
      if (propertyResult.status === 'fulfilled' && propertyResult.value?.success) {
        setPropertyAnalytics(propertyResult.value.data || {});
      }
      if (performanceResult.status === 'fulfilled' && performanceResult.value?.success) {
        setPerformanceAnalytics(performanceResult.value.data || {});
      }
      if (activityResult.status === 'fulfilled' && activityResult.value?.success) {
        setActivityFeed(activityResult.value.data || []);
      }
      if (hasAnySuccess) setLastUpdated(new Date());
      if (!silent) setDashboardLoading(false);
    },
    [currentUser?.id]
  );

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, Math.max(dashboardRefreshInterval, 10000));
    return () => clearInterval(intervalId);
  }, [fetchDashboardData, dashboardRefreshInterval]);

  const recentTransactions = useMemo(() => {
    const records = overviewData?.recent?.transactions || [];
    return records.map(normalizeTransaction);
  }, [overviewData]);

  const menuItems = useMemo(() => {
    const baseItems = [
      { path: '/dashboard', icon: Grid3x3Gap, label: 'Overview', exact: true },
      { path: '/dashboard/transactions', icon: CashCoin, label: 'Transactions' },
      { path: '/dashboard/reports', icon: FileText, label: 'Reports' },
      { path: '/dashboard/settings', icon: Gear, label: 'Settings' }
    ];
    if (canManageProperties) {
      baseItems.splice(1, 0, { path: '/dashboard/properties', icon: Building, label: 'Properties' });
    }
    return baseItems;
  }, [canManageProperties]);

  return (
    <div className="dashboard-wrapper">
      <button
        className="btn btn-primary-custom d-lg-none position-fixed"
        style={{ bottom: '20px', right: '20px', zIndex: 1001, borderRadius: '50%', width: '50px', height: '50px', padding: 0 }}
        onClick={() => setSidebarOpen((prev) => !prev)}
      >
        {sidebarOpen ? <X size={20} /> : <List size={20} />}
      </button>

      <aside className={`dashboard-sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-user">
            <img src={currentUser?.avatar || DEFAULT_AVATAR} alt={displayName} className="sidebar-user-avatar" />
            <div className="sidebar-user-info">
              <h5>{displayName}</h5>
              <span>{displayRole}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-nav-section">Main Menu</p>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon /> {item.label}
            </NavLink>
          ))}

          <p className="sidebar-nav-section">Account</p>
          <NavLink to="/dashboard/profile" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
            <PersonCircle /> Profile
          </NavLink>
        </nav>
      </aside>

      <main className="dashboard-content">
        {dashboardError && <div className="alert alert-danger mb-3">{dashboardError}</div>}
        {lastUpdated && <div className="text-muted small mb-3">Last updated: {lastUpdated.toLocaleTimeString()}</div>}

        <Routes>
          <Route
            index
            element={
              <DashboardHome
                overview={overviewData}
                revenueAnalytics={revenueAnalytics}
                propertyAnalytics={propertyAnalytics}
                performance={performanceAnalytics}
                activity={activityFeed}
                recentTransactions={recentTransactions}
                loading={dashboardLoading}
                onRefresh={fetchDashboardData}
                onAddProperty={() => navigate('/dashboard/properties')}
                canManageProperties={canManageProperties}
              />
            }
          />
          <Route path="properties" element={<PropertiesManagement canManageProperties={canManageProperties} />} />
          <Route path="transactions" element={<TransactionsManagement />} />
          <Route
            path="reports"
            element={
              <ReportsManagement
                overview={overviewData}
                revenueAnalytics={revenueAnalytics}
                propertyAnalytics={propertyAnalytics}
                performanceAnalytics={performanceAnalytics}
                loading={dashboardLoading}
                onRefresh={fetchDashboardData}
              />
            }
          />
          <Route path="settings" element={<SettingsManagement user={currentUser} onUpdateProfile={updateProfile} onChangePassword={changePassword} />} />
          <Route path="profile" element={<ProfileManagement user={currentUser} onUpdateProfile={updateProfile} />} />
        </Routes>
      </main>
    </div>
  );
}

export default Dashboard;
