/**
 * Businesses Page - Business discovery and interaction
 * Separate from People (personal friends)
 * 
 * Features:
 * - Search businesses by name or @handle
 * - Browse categories
 * - View businesses you've paid
 * - Start chat / Pay business
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../contexts/SessionContext";
import { 
  discoverBusinesses, 
  getBusinessCategories, 
  getBusinessesPaid,
  startBusinessChat 
} from "../../lib/businessesApi";
import { searchBusinesses } from "../../lib/profilesApi";

// BusinessCard component - moved outside to avoid re-renders
function BusinessCard({ business, onMessage, onPay, isLoading }) {
  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
      data-testid="business-card"
    >
      <div className="flex items-start gap-3">
        {/* Logo */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#1a4a7c] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {business.logo_url ? (
            <img 
              src={business.logo_url} 
              alt={business.business_name} 
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            business.business_name?.[0]?.toUpperCase() || "B"
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#0A2540] truncate">{business.business_name}</h3>
            {business.verified && (
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            {business.handle && (
              <span className="text-sm text-gray-500">@{business.handle}</span>
            )}
            {business.category && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {business.category}
              </span>
            )}
          </div>
          
          {/* Badge */}
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0A2540]/10 text-[#0A2540] text-xs font-medium rounded">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
              Business
            </span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onMessage(business)}
          disabled={isLoading}
          className="flex-1 h-10 flex items-center justify-center gap-2 bg-gray-100 text-[#0A2540] rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
          data-testid="business-message-btn"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Message
        </button>
        <button
          onClick={() => onPay(business)}
          className="flex-1 h-10 flex items-center justify-center gap-2 bg-[#0A2540] text-white rounded-lg font-medium hover:bg-[#0A2540]/90 transition"
          data-testid="business-pay-btn"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pay
        </button>
      </div>
    </div>
  );
}

export default function Businesses() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState("discover"); // discover | paid
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [businesses, setBusinesses] = useState([]);
  const [paidBusinesses, setPaidBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Action state
  const [actionLoading, setActionLoading] = useState({});

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bizData, catData, paidData] = await Promise.all([
          discoverBusinesses(null, 20),
          getBusinessCategories(),
          getBusinessesPaid().catch(() => ({ businesses: [] }))
        ]);
        
        setBusinesses(bizData.businesses || []);
        setCategories(catData.categories || []);
        setPaidBusinesses(paidData.businesses || []);
      } catch (error) {
        console.error("Failed to fetch businesses:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter by category
  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const data = await discoverBusinesses(category, 20);
      setBusinesses(data.businesses || []);
    } catch (error) {
      console.error("Failed to filter:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search businesses
  const handleSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const result = await searchBusinesses(query);
      setSearchResults(result.profiles || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Start chat with business
  const handleMessage = async (business) => {
    setActionLoading(prev => ({ ...prev, [business.profile_id]: true }));
    try {
      await startBusinessChat(business.profile_id);
      navigate(`/sender/chat/${business.profile_id}?type=business`);
    } catch (error) {
      console.error("Failed to start chat:", error);
      alert(error.message || "Failed to start chat");
    } finally {
      setActionLoading(prev => ({ ...prev, [business.profile_id]: false }));
    }
  };

  // Navigate to pay business
  const handlePay = (business) => {
    navigate(`/sender/pay-business/${business.profile_id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[#0A2540]">Businesses</h1>
        <p className="text-sm text-gray-500 mt-1">Discover and pay businesses</p>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search businesses by name or @handle"
            className="w-full h-11 pl-10 pr-4 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-[#0A2540]/20 outline-none"
            data-testid="business-search"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((business) => (
              <BusinessCard 
                key={business.profile_id} 
                business={business} 
                onMessage={handleMessage}
                onPay={handlePay}
                isLoading={actionLoading[business.profile_id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "discover"
              ? "text-[#0A2540] border-[#0A2540]"
              : "text-gray-500 border-transparent"
          }`}
          data-testid="tab-discover"
        >
          Discover
        </button>
        <button
          onClick={() => setActiveTab("paid")}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
            activeTab === "paid"
              ? "text-[#0A2540] border-[#0A2540]"
              : "text-gray-500 border-transparent"
          }`}
          data-testid="tab-paid"
        >
          Recently Paid
        </button>
      </div>

      {/* Categories (only on discover tab) */}
      {activeTab === "discover" && (
        <div className="px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                !selectedCategory
                  ? "bg-[#0A2540] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? "bg-[#0A2540] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Discover Tab */}
            {activeTab === "discover" && (
              <div className="space-y-3">
                {businesses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No businesses found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedCategory ? `No businesses in "${selectedCategory}"` : "Check back later for new businesses"}
                    </p>
                  </div>
                ) : (
                  businesses.map((business) => (
                    <BusinessCard 
                      key={business.profile_id} 
                      business={business}
                      onMessage={handleMessage}
                      onPay={handlePay}
                      isLoading={actionLoading[business.profile_id]}
                    />
                  ))
                )}
              </div>
            )}

            {/* Recently Paid Tab */}
            {activeTab === "paid" && (
              <div className="space-y-3">
                {paidBusinesses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No payment history</p>
                    <p className="text-sm text-gray-500 mt-1">Businesses you pay will appear here</p>
                  </div>
                ) : (
                  paidBusinesses.map((business) => (
                    <BusinessCard 
                      key={business.profile_id} 
                      business={business}
                      onMessage={handleMessage}
                      onPay={handlePay}
                      isLoading={actionLoading[business.profile_id]}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
