import { useState, useMemo } from 'react';
import './CaseForm.css';

// Simple SVG Icon Components (until react-icons is installed)
const ClipboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M3.5 2a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-12a.5.5 0 0 0-.5-.5h-1.25a.5.5 0 0 1-.5-.5V1a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 1-.5.5H3.5zm0 1h.5v-.5h5V3h-5v10h9V3H4.5v10z"/>
    <path d="M5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
  </svg>
);

const HospitalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2H9v6a1 1 0 1 1-2 0V9H1a1 1 0 1 1 0-2h6V1a1 1 0 0 1 1-1z"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1 8a7 7 0 0 1 7-7v14a7 7 0 0 1-7-7zm15 0a7 7 0 0 1-7 7V1a7 7 0 0 1 7 7z"/>
  </svg>
);

function CaseForm() {
  const [activeTab, setActiveTab] = useState('general');
  const [patientSubTab, setPatientSubTab] = useState('patient'); // For Patient sub-tabs
  const [formData, setFormData] = useState({});
  const [raceList, setRaceList] = useState([]); // For Race Information list
  const [medicalHistoryRows, setMedicalHistoryRows] = useState([{ 
    id: 1,
    startDate: '',
    stopDate: '',
    ongoing: false,
    age: '',
    ageUnits: '',
    conditionType: '',
    verbatimTerm: '',
    familyHistory: false,
    pt: '',
    llt: '',
    notes: '',
    language: '',
    source: ''
  }]); // Other Relevant History rows
  const [selectedRowId, setSelectedRowId] = useState(1);
  const [showEncodeModal, setShowEncodeModal] = useState(false);
  const [encodeRowId, setEncodeRowId] = useState(null);
  const [encodeSearchTerm, setEncodeSearchTerm] = useState('');
  
  // Products management - Dynamic tabs
  const [staticProducts, setStaticProducts] = useState([
    { id: 'sodium-oxybate', name: 'Sodium Oxybate Hikma' },
    { id: 'propranolol', name: 'Propranolol' },
    { id: 'zofran', name: 'Zofran (Ondansetron)' },
    { id: 'vitamin-d3', name: 'Vitamin D3' },
    { id: 'diclofenac', name: 'Diclofenac Potassium' },
    { id: 'imitrex', name: 'Imitrex (Sumatriptan)' }
  ]);
  const [activeProductId, setActiveProductId] = useState(staticProducts[0].id); // Currently selected product ID
  const [productData, setProductData] = useState({}); // Store data for each static product

  // Function to add a new product
  const addProduct = () => {
    const newId = `product-${Date.now()}`;
    const newProduct = {
      id: newId,
      name: `New Product ${staticProducts.length + 1}`
    };
    setStaticProducts(prev => [...prev, newProduct]);
    setActiveProductId(newId);
  };

  // Events management - Dynamic events with sub-tabs
  const [events, setEvents] = useState([
    { id: 'event-1', term: 'Event Term 1', status: 'New' }
  ]);
  const [activeEventId, setActiveEventId] = useState(events[0].id);
  const [eventSubTab, setEventSubTab] = useState('event'); // 'event', 'assessment', 'product-event-details'
  const [eventData, setEventData] = useState({}); // Store data for each event
  const [selectedProductEventPair, setSelectedProductEventPair] = useState(null); // Selected product-event combination for details
  const [productEventRelationships, setProductEventRelationships] = useState({}); // Store causality/relationship data for each product-event pair

  // Function to add a new event
  const addEvent = () => {
    const newId = `event-${Date.now()}`;
    const newEvent = {
      id: newId,
      term: `Event Term ${events.length + 1}`,
      status: 'New'
    };
    setEvents(prev => [...prev, newEvent]);
    setActiveEventId(newId);
  };

  // Helper functions for event data management
  const getEventValue = (field) => {
    if (!eventData[activeEventId]) return '';
    return eventData[activeEventId][field] || '';
  };

  const getEventCheckboxValue = (field) => {
    if (!eventData[activeEventId]) return false;
    return eventData[activeEventId][field] || false;
  };

  const updateEvent = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [activeEventId]: {
        ...prev[activeEventId],
        [field]: value
      }
    }));
  };

  // Helper functions for product-event relationship data
  const getRelationshipValue = (field) => {
    if (!selectedProductEventPair) return '';
    const relationship = productEventRelationships[selectedProductEventPair] || {};
    return relationship[field] || '';
  };

  const updateRelationship = (field, value) => {
    if (!selectedProductEventPair) return;
    setProductEventRelationships(prev => ({
      ...prev,
      [selectedProductEventPair]: {
        ...prev[selectedProductEventPair],
        [field]: value
      }
    }));
  };

  // ✅ Dynamic combinations calculation using useMemo (recomputes when events/products change)
  const productEventCombinations = useMemo(() => {
    const combinations = [];
    
    // Loop: Events × Products
    events.forEach(event => {
      staticProducts.forEach(product => {
        // ✅ Consistent pairKey format: productId-eventId
        const pairKey = `${product.id}-${event.id}`;
        const relationship = productEventRelationships[pairKey] || {};
        const eventDataItem = eventData[event.id] || {};
        
        combinations.push({
          key: pairKey,
          productId: product.id,
          productName: product.name,
          eventId: event.id,
          eventTerm: event.term,
          eventPT: eventDataItem.pt || 'N/A',
          eventLLT: eventDataItem.llt || 'N/A',
          causalityReported: relationship.causalityAsReported || 'Not Reported',
          causalityDetermined: relationship.causalityAsDetermined || 'Not Reported',
          drugRole: relationship.drugRole || 'Not Set'
        });
      });
    });
    
    return combinations;
  }, [events, staticProducts, productEventRelationships, eventData]);

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'patient', label: 'Patient' },
    { id: 'products', label: 'Products' },
    { id: 'events', label: 'Events' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'activities', label: 'Activities' },
    { id: 'additional', label: 'Additional Information' },
    { id: 'regulatory', label: 'Regulatory Reports' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getValue = (field) => formData[field] || '';
  
  const getCheckboxValue = (field) => {
    const value = formData[field];
    return value === true || value === 'true';
  };

  const updateMedicalHistoryRow = (rowId, field, value) => {
    setMedicalHistoryRows(prevRows => 
      prevRows.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  // Product management functions for STATIC tabs
  const updateProduct = (productId, field, value) => {
    setProductData(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: value
      }
    }));
  };

  const updateProductArray = (productId, field, arrayValue) => {
    setProductData(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: arrayValue
      }
    }));
  };

  const getActiveProductData = () => {
    return productData[activeProductId] || {};
  };

  const getProductValue = (field) => {
    const product = getActiveProductData();
    return product[field] || '';
  };

  const getProductCheckboxValue = (field) => {
    const product = getActiveProductData();
    return product ? (product[field] === true || product[field] === 'true') : false;
  };

  // Helper function to render a single product's form content (STATIC)
  const renderProductContent = (productId) => {
    const getProdValue = (field) => getProductValue(field);
    const getProdCheckbox = (field) => getProductCheckboxValue(field);
    const updateProd = (field, value) => updateProduct(productId, field, value);
    const updateProdArray = (field, arrayValue) => updateProductArray(productId, field, arrayValue);
    const product = getActiveProductData();

    return (
      <>
        {/* Product Information Section */}
        <section className="form-section">
          <h3>1. Product Information</h3>
          
          <div className="form-subsection">
            <h4>Product Role <span className="regulatory-note">⚠️ Regulatory-critical field</span></h4>
            <div className="form-grid">
              <div className="form-group radio-group">
                <label>
                  <input 
                    type="radio" 
                    name={`productRole-${productId}`}
                    value="suspect"
                    checked={getProdValue('productRole') === 'suspect'}
                    onChange={(e) => updateProd('productRole', e.target.value)}
                  />
                  Suspect – Product suspected to cause the event
                </label>
                <label>
                  <input 
                    type="radio" 
                    name={`productRole-${productId}`}
                    value="concomitant"
                    checked={getProdValue('productRole') === 'concomitant'}
                    onChange={(e) => updateProd('productRole', e.target.value)}
                  />
                  Concomitant – Taken at same time but not suspected
                </label>
                <label>
                  <input 
                    type="radio" 
                    name={`productRole-${productId}`}
                    value="treatment"
                    checked={getProdValue('productRole') === 'treatment'}
                    onChange={(e) => updateProd('productRole', e.target.value)}
                  />
                  Treatment – Used to treat the event
                </label>
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h4>2. Product Identity</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Product Name</label>
                <div className="input-with-buttons">
                  <input 
                    type="text" 
                    value={getProdValue('productName')} 
                    onChange={(e) => updateProd('productName', e.target.value)}
                    placeholder="Enter product name"
                  />
                  <button className="btn-small" type="button" title="Select from lookup">Select</button>
                  <button className="btn-small" type="button" title="Encode using WHO Drug dictionary">Encode</button>
                </div>
              </div>
              <div className="form-group">
                <label>Generic Name</label>
                <input type="text" value={getProdValue('genericName')} onChange={(e) => updateProd('genericName', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h4>3. Product Identifier <span className="regulatory-note">Used for precise product identification</span></h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Product Identifier Type</label>
                <select value={getProdValue('productIdentifierType')} onChange={(e) => updateProd('productIdentifierType', e.target.value)}>
                  <option value="">Select</option>
                  <option value="ndc">NDC</option>
                  <option value="upc">UPC</option>
                  <option value="ean">EAN</option>
                </select>
              </div>
              <div className="form-group">
                <label>Product Identifier</label>
                <input type="text" value={getProdValue('productIdentifier')} onChange={(e) => updateProd('productIdentifier', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Version</label>
                <input type="text" value={getProdValue('productVersion')} onChange={(e) => updateProd('productVersion', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h4>4. Company / Regulatory Information <span className="regulatory-note">Used for global regulatory submissions</span></h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Company Drug Code</label>
                <input type="text" value={getProdValue('companyDrugCode')} onChange={(e) => updateProd('companyDrugCode', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Obtain Drug Country</label>
                <input type="text" value={getProdValue('obtainDrugCountry')} onChange={(e) => updateProd('obtainDrugCountry', e.target.value)} />
              </div>
              <div className="form-group">
                <label>WHO Drug Code</label>
                <input type="text" value={getProdValue('whoDrugCode')} onChange={(e) => updateProd('whoDrugCode', e.target.value)} />
              </div>
              <div className="form-group">
                <label>WHO Medicinal Product ID</label>
                <input type="text" value={getProdValue('whoMedicinalProductId')} onChange={(e) => updateProd('whoMedicinalProductId', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Manufacturer</label>
                <input type="text" value={getProdValue('manufacturer')} onChange={(e) => updateProd('manufacturer', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Market Authorization Holder</label>
                <input type="text" value={getProdValue('marketAuthorizationHolder')} onChange={(e) => updateProd('marketAuthorizationHolder', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Authorization Type</label>
                <select value={getProdValue('authorizationType')} onChange={(e) => updateProd('authorizationType', e.target.value)}>
                  <option value="">Select</option>
                  <option value="marketing">Marketing</option>
                  <option value="compassionate">Compassionate</option>
                  <option value="clinical-trial">Clinical Trial</option>
                </select>
              </div>
              <div className="form-group">
                <label>Authorization Number</label>
                <input type="text" value={getProdValue('authorizationNumber')} onChange={(e) => updateProd('authorizationNumber', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h4>5. Product Characteristics</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Formulation</label>
                <select value={getProdValue('formulation')} onChange={(e) => updateProd('formulation', e.target.value)}>
                  <option value="">Select</option>
                  <option value="tablet">Tablet</option>
                  <option value="oral-solution">Oral Solution</option>
                  <option value="injection">Injection</option>
                  <option value="capsule">Capsule</option>
                  <option value="cream">Cream</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Drug Authorization Country</label>
                <input type="text" value={getProdValue('drugAuthorizationCountry')} onChange={(e) => updateProd('drugAuthorizationCountry', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Strength</label>
                <input type="text" value={getProdValue('strength')} onChange={(e) => updateProd('strength', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Units</label>
                <input type="text" value={getProdValue('strengthUnits')} onChange={(e) => updateProd('strengthUnits', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Interaction?</label>
                <select value={getProdValue('interaction')} onChange={(e) => updateProd('interaction', e.target.value)}>
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contraindicated?</label>
                <select value={getProdValue('contraindicated')} onChange={(e) => updateProd('contraindicated', e.target.value)}>
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={getProdCheckbox('drugNotAdministered')} 
                    onChange={(e) => updateProd('drugNotAdministered', e.target.checked)} 
                  />
                  Drug Not Administered
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Substance Information Table */}
        <section className="form-section">
          <h3>2. Substance Information</h3>
          <p className="section-note">Used when product has active substances</p>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Substance Name</th>
                  <th>Substance Term ID</th>
                  <th>Version</th>
                  <th>Strength</th>
                  <th>Unit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!product.substanceRows || product.substanceRows.length === 0) ? (
                  <tr>
                    <td colSpan="6" className="empty-table">No substances added</td>
                  </tr>
                ) : (
                  product.substanceRows.map((row, idx) => (
                    <tr key={idx}>
                      <td><input type="text" value={row.substanceName || ''} onChange={(e) => {
                        const newRows = [...product.substanceRows];
                        newRows[idx].substanceName = e.target.value;
                        updateProdArray('substanceRows', newRows);
                      }} /></td>
                      <td><input type="text" value={row.substanceTermId || ''} onChange={(e) => {
                        const newRows = [...product.substanceRows];
                        newRows[idx].substanceTermId = e.target.value;
                        updateProdArray('substanceRows', newRows);
                      }} /></td>
                      <td><input type="text" value={row.version || ''} onChange={(e) => {
                        const newRows = [...product.substanceRows];
                        newRows[idx].version = e.target.value;
                        updateProdArray('substanceRows', newRows);
                      }} /></td>
                      <td><input type="text" value={row.strength || ''} onChange={(e) => {
                        const newRows = [...product.substanceRows];
                        newRows[idx].strength = e.target.value;
                        updateProdArray('substanceRows', newRows);
                      }} /></td>
                      <td><input type="text" value={row.unit || ''} onChange={(e) => {
                        const newRows = [...product.substanceRows];
                        newRows[idx].unit = e.target.value;
                        updateProdArray('substanceRows', newRows);
                      }} /></td>
                      <td>
                        <button className="btn-small btn-danger" onClick={() => {
                          const newRows = product.substanceRows.filter((_, i) => i !== idx);
                          updateProdArray('substanceRows', newRows);
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="table-actions">
              <button className="btn-small" onClick={() => {
                const newRows = [...(product.substanceRows || []), { substanceName: '', substanceTermId: '', version: '', strength: '', unit: '' }];
                updateProdArray('substanceRows', newRows);
              }}>Add</button>
            </div>
          </div>
        </section>

        {/* Product Name Parts Information Table */}
        <section className="form-section">
          <h3>3. Product Name Parts Information</h3>
          <p className="section-note">Used for combination or branded products</p>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name Part Type</th>
                  <th>Name Part</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!product.namePartsRows || product.namePartsRows.length === 0) ? (
                  <tr>
                    <td colSpan="3" className="empty-table">No name parts added</td>
                  </tr>
                ) : (
                  product.namePartsRows.map((row, idx) => (
                    <tr key={idx}>
                      <td><input type="text" value={row.namePartType || ''} onChange={(e) => {
                        const newRows = [...product.namePartsRows];
                        newRows[idx].namePartType = e.target.value;
                        updateProdArray('namePartsRows', newRows);
                      }} /></td>
                      <td><input type="text" value={row.namePart || ''} onChange={(e) => {
                        const newRows = [...product.namePartsRows];
                        newRows[idx].namePart = e.target.value;
                        updateProdArray('namePartsRows', newRows);
                      }} /></td>
                      <td>
                        <button className="btn-small btn-danger" onClick={() => {
                          const newRows = product.namePartsRows.filter((_, i) => i !== idx);
                          updateProdArray('namePartsRows', newRows);
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="table-actions">
              <button className="btn-small" onClick={() => {
                const newRows = [...(product.namePartsRows || []), { namePartType: '', namePart: '' }];
                updateProdArray('namePartsRows', newRows);
              }}>Add</button>
            </div>
          </div>
        </section>

        {/* Product Indication Section */}
        <section className="form-section">
          <h3>4. Product Indication</h3>
          <p className="section-note">📌 Indication ≠ Event. Indication = reason for taking drug. Event = adverse reaction</p>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reported Indication (verbatim)</th>
                  <th>NF</th>
                  <th>Coded Indication (MedDRA)</th>
                  <th>Encode</th>
                  <th>Language Flag</th>
                  <th>Confirmation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!product.indicationRows || product.indicationRows.length === 0) ? (
                  <tr>
                    <td colSpan="7" className="empty-table">No indications added</td>
                  </tr>
                ) : (
                  product.indicationRows.map((row, idx) => (
                    <tr key={idx}>
                      <td><input type="text" value={row.reportedIndication || ''} onChange={(e) => {
                        const newRows = [...product.indicationRows];
                        newRows[idx].reportedIndication = e.target.value;
                        updateProdArray('indicationRows', newRows);
                      }} /></td>
                      <td>
                        <input type="checkbox" checked={row.nfIndicator || false} onChange={(e) => {
                          const newRows = [...product.indicationRows];
                          newRows[idx].nfIndicator = e.target.checked;
                          updateProdArray('indicationRows', newRows);
                        }} />
                      </td>
                      <td><input type="text" value={row.codedIndication || ''} readOnly /></td>
                      <td><button className="btn-small" onClick={() => {/* Encode logic */}}>Encode</button></td>
                      <td><input type="text" value={row.languageFlag || ''} onChange={(e) => {
                        const newRows = [...product.indicationRows];
                        newRows[idx].languageFlag = e.target.value;
                        updateProdArray('indicationRows', newRows);
                      }} /></td>
                      <td>
                        <input type="checkbox" checked={row.confirmationCheck || false} onChange={(e) => {
                          const newRows = [...product.indicationRows];
                          newRows[idx].confirmationCheck = e.target.checked;
                          updateProdArray('indicationRows', newRows);
                        }} />
                      </td>
                      <td>
                        <div className="table-row-actions">
                          <button className="btn-small" onClick={() => {
                            if (idx > 0) {
                              const newRows = [...product.indicationRows];
                              [newRows[idx - 1], newRows[idx]] = [newRows[idx], newRows[idx - 1]];
                              updateProdArray('indicationRows', newRows);
                            }
                          }}>↑</button>
                          <button className="btn-small" onClick={() => {
                            if (idx < product.indicationRows.length - 1) {
                              const newRows = [...product.indicationRows];
                              [newRows[idx], newRows[idx + 1]] = [newRows[idx + 1], newRows[idx]];
                              updateProdArray('indicationRows', newRows);
                            }
                          }}>↓</button>
                          <button className="btn-small btn-danger" onClick={() => {
                            const newRows = product.indicationRows.filter((_, i) => i !== idx);
                            updateProdArray('indicationRows', newRows);
                          }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="table-actions">
              <button className="btn-small" onClick={() => {
                const newRows = [...(product.indicationRows || []), { reportedIndication: '', nfIndicator: false, codedIndication: '', languageFlag: '', confirmationCheck: false }];
                updateProdArray('indicationRows', newRows);
              }}>Add</button>
            </div>
          </div>
        </section>

        {/* Quality Control Section */}
        <section className="form-section">
          <h3>5. Quality Control</h3>
          <p className="section-note">Used mostly in clinical / study cases</p>
          <div className="form-grid">
            <div className="form-group">
              <label>QC Safety Date</label>
              <input type="date" value={getProdValue('qcSafetyDate')} onChange={(e) => updateProd('qcSafetyDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>QC Sent Date</label>
              <input type="date" value={getProdValue('qcSentDate')} onChange={(e) => updateProd('qcSentDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>QC Cross Reference</label>
              <input type="text" value={getProdValue('qcCrossReference')} onChange={(e) => updateProd('qcCrossReference', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Date Returned</label>
              <input type="date" value={getProdValue('dateReturned')} onChange={(e) => updateProd('dateReturned', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Global ID</label>
              <input type="text" value={getProdValue('globalId')} onChange={(e) => updateProd('globalId', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input type="text" value={getProdValue('quantity')} onChange={(e) => updateProd('quantity', e.target.value)} />
            </div>
          </div>
        </section>

        {/* CID / PCID / LOT Information */}
        <section className="form-section">
          <h3>6. CID / PCID / LOT Information</h3>
          <p className="section-note">Used for traceability</p>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>CID Number</th>
                  <th>PCID Number</th>
                  <th>Lot Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!product.cidPcidLotRows || product.cidPcidLotRows.length === 0) ? (
                  <tr>
                    <td colSpan="4" className="empty-table">No CID/PCID/LOT entries added</td>
                  </tr>
                ) : (
                  product.cidPcidLotRows.map((row, idx) => (
                    <tr key={idx}>
                      <td><input type="text" value={row.cidNumber || ''} onChange={(e) => {
                        const newRows = [...product.cidPcidLotRows];
                        newRows[idx].cidNumber = e.target.value;
                        updateProdArray('cidPcidLotRows', newRows);
                      }} /></td>
                      <td><input type="text" value={row.pcidNumber || ''} onChange={(e) => {
                        const newRows = [...product.cidPcidLotRows];
                        newRows[idx].pcidNumber = e.target.value;
                        updateProdArray('cidPcidLotRows', newRows);
                      }} /></td>
                      <td><input type="text" value={row.lotNumber || ''} onChange={(e) => {
                        const newRows = [...product.cidPcidLotRows];
                        newRows[idx].lotNumber = e.target.value;
                        updateProdArray('cidPcidLotRows', newRows);
                      }} /></td>
                      <td>
                        <button className="btn-small btn-danger" onClick={() => {
                          const newRows = product.cidPcidLotRows.filter((_, i) => i !== idx);
                          updateProdArray('cidPcidLotRows', newRows);
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="table-actions">
              <button className="btn-small" onClick={() => {
                const newRows = [...(product.cidPcidLotRows || []), { cidNumber: '', pcidNumber: '', lotNumber: '' }];
                updateProdArray('cidPcidLotRows', newRows);
              }}>Add</button>
            </div>
          </div>
        </section>

        {/* Dosage Regimens Section */}
        <section className="form-section">
          <h3>7. Dosage Regimens</h3>
          <p className="section-note">This section defines HOW the product was taken</p>
          
          <div className="form-subsection">
            <h4>A. Dosage Timing</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Start Date/Time</label>
                <div className="input-with-checkbox">
                  <input type="datetime-local" value={getProdValue('dosageStartDateTime')} onChange={(e) => updateProd('dosageStartDateTime', e.target.value)} />
                  <label><input type="checkbox" checked={getProdCheckbox('dosageStartNF')} onChange={(e) => updateProd('dosageStartNF', e.target.checked)} /> NF</label>
                </div>
              </div>
              <div className="form-group">
                <label>Stop Date/Time</label>
                <div className="input-with-checkbox">
                  <input type="datetime-local" value={getProdValue('dosageStopDateTime')} onChange={(e) => updateProd('dosageStopDateTime', e.target.value)} />
                  <label><input type="checkbox" checked={getProdCheckbox('dosageStopNF')} onChange={(e) => updateProd('dosageStopNF', e.target.checked)} /> NF</label>
                </div>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={getProdCheckbox('dosageOngoing')} onChange={(e) => updateProd('dosageOngoing', e.target.checked)} />
                  Ongoing
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" checked={getProdCheckbox('dosageOutsideTherapeuticRange')} onChange={(e) => updateProd('dosageOutsideTherapeuticRange', e.target.checked)} />
                  Outside Therapeutic Range
                </label>
              </div>
              <div className="form-group">
                <label>Duration of Regimen</label>
                <input type="text" value={getProdValue('durationOfRegimen')} onChange={(e) => updateProd('durationOfRegimen', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h4>B. Dose Details</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Dose Number</label>
                <input type="text" value={getProdValue('doseNumber')} onChange={(e) => updateProd('doseNumber', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Dose</label>
                <input type="text" value={getProdValue('dose')} onChange={(e) => updateProd('dose', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Units</label>
                <input type="text" value={getProdValue('doseUnits')} onChange={(e) => updateProd('doseUnits', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Frequency</label>
                <input type="text" value={getProdValue('frequency')} onChange={(e) => updateProd('frequency', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h4>C. Dose Description</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Dose Description</label>
                <input type="text" value={getProdValue('doseDescription')} onChange={(e) => updateProd('doseDescription', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Daily Dosage</label>
                <input type="text" value={getProdValue('dailyDosage')} onChange={(e) => updateProd('dailyDosage', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Daily Dosage Units</label>
                <input type="text" value={getProdValue('dailyDosageUnits')} onChange={(e) => updateProd('dailyDosageUnits', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h4>D. Route & Packaging</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Patient Route of Administration</label>
                <input type="text" value={getProdValue('patientRouteOfAdministration')} onChange={(e) => updateProd('patientRouteOfAdministration', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Parent Route of Administration</label>
                <input type="text" value={getProdValue('parentRouteOfAdministration')} onChange={(e) => updateProd('parentRouteOfAdministration', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Regimen Dosage</label>
                <input type="text" value={getProdValue('regimenDosage')} onChange={(e) => updateProd('regimenDosage', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Regimen Dosage Units</label>
                <input type="text" value={getProdValue('regimenDosageUnits')} onChange={(e) => updateProd('regimenDosageUnits', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Package ID</label>
                <input type="text" value={getProdValue('packageId')} onChange={(e) => updateProd('packageId', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Pack Units</label>
                <input type="text" value={getProdValue('packUnits')} onChange={(e) => updateProd('packUnits', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Batch / Lot #</label>
                <input type="text" value={getProdValue('batchLotNumber')} onChange={(e) => updateProd('batchLotNumber', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Expiration Date</label>
                <div className="input-with-checkbox">
                  <input type="date" value={getProdValue('expirationDate')} onChange={(e) => updateProd('expirationDate', e.target.value)} />
                  <label><input type="checkbox" checked={getProdCheckbox('expirationDateNF')} onChange={(e) => updateProd('expirationDateNF', e.target.checked)} /> NF</label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Details (Pharmacology) */}
        <section className="form-section">
          <h3>8. Product Details (Exposure & Timing)</h3>
          <p className="section-note">Used to assess temporal relationship to event</p>
          
          <div className="form-subsection">
            <h4>Exposure Fields</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>First Dose Date</label>
                <input type="date" value={getProdValue('firstDoseDate')} onChange={(e) => updateProd('firstDoseDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Last Dose Date</label>
                <input type="date" value={getProdValue('lastDoseDate')} onChange={(e) => updateProd('lastDoseDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Duration of Administration</label>
                <input type="text" value={getProdValue('durationOfAdministration')} onChange={(e) => updateProd('durationOfAdministration', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Total Dosage</label>
                <input type="text" value={getProdValue('totalDosage')} onChange={(e) => updateProd('totalDosage', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Total Dosage Units</label>
                <input type="text" value={getProdValue('totalDosageUnits')} onChange={(e) => updateProd('totalDosageUnits', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h4>Temporal Relationship</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Time Between First Dose / Primary Event</label>
                <input type="text" value={getProdValue('timeBetweenFirstDosePrimaryEvent')} onChange={(e) => updateProd('timeBetweenFirstDosePrimaryEvent', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Time Between Last Dose / Primary Event</label>
                <input type="text" value={getProdValue('timeBetweenLastDosePrimaryEvent')} onChange={(e) => updateProd('timeBetweenLastDosePrimaryEvent', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Total Dose to Primary Event</label>
                <input type="text" value={getProdValue('totalDoseToPrimaryEvent')} onChange={(e) => updateProd('totalDoseToPrimaryEvent', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Total Dose to Primary Event Units</label>
                <input type="text" value={getProdValue('totalDoseToPrimaryEventUnits')} onChange={(e) => updateProd('totalDoseToPrimaryEventUnits', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h4>Pregnancy / Special Population</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Gestation Period at Exposure</label>
                <input type="text" value={getProdValue('gestationPeriodAtExposure')} onChange={(e) => updateProd('gestationPeriodAtExposure', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Gestation Period Unit</label>
                <input type="text" value={getProdValue('gestationPeriodUnit')} onChange={(e) => updateProd('gestationPeriodUnit', e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        {/* Action / Response */}
        <section className="form-section">
          <h3>9. Action Taken / Response</h3>
          <p className="section-note">Used to assess causality</p>
          <div className="form-grid">
            <div className="form-group">
              <label>Action Taken</label>
              <select value={getProdValue('actionTaken')} onChange={(e) => updateProd('actionTaken', e.target.value)}>
                <option value="">Select</option>
                <option value="dose-reduced">Dose Reduced</option>
                <option value="dose-increased">Dose Increased</option>
                <option value="drug-withdrawn">Drug Withdrawn</option>
                <option value="drug-interrupted">Drug Interrupted</option>
                <option value="dose-not-changed">Dose Not Changed</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="form-group">
              <label>Dechallenge Results</label>
              <select value={getProdValue('dechallengeResults')} onChange={(e) => updateProd('dechallengeResults', e.target.value)}>
                <option value="">Select</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="form-group">
              <label>Dechallenge Date</label>
              <input type="date" value={getProdValue('dechallengeDate')} onChange={(e) => updateProd('dechallengeDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Rechallenge Results</label>
              <select value={getProdValue('rechallengeResults')} onChange={(e) => updateProd('rechallengeResults', e.target.value)}>
                <option value="">Select</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="form-group">
              <label>Rechallenge Start Date/Time</label>
              <input type="datetime-local" value={getProdValue('rechallengeStartDateTime')} onChange={(e) => updateProd('rechallengeStartDateTime', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Rechallenge Stop Date/Time</label>
              <input type="datetime-local" value={getProdValue('rechallengeStopDateTime')} onChange={(e) => updateProd('rechallengeStopDateTime', e.target.value)} />
            </div>
          </div>
        </section>

        {/* History / Quality Flags */}
        <section className="form-section">
          <h3>10. History / Quality Flags</h3>
          <p className="section-note">Quality flags affect signal detection</p>
          <div className="form-grid">
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={getProdCheckbox('takenPreviouslyTolerated')} onChange={(e) => updateProd('takenPreviouslyTolerated', e.target.checked)} />
                Taken Previously / Tolerated
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={getProdCheckbox('misuseAbuse')} onChange={(e) => updateProd('misuseAbuse', e.target.checked)} />
                Misuse / Abuse
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={getProdCheckbox('batchLotTestedWithinSpec')} onChange={(e) => updateProd('batchLotTestedWithinSpec', e.target.checked)} />
                Batch and lot tested and found within specifications
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={getProdCheckbox('batchLotTestedNotWithinSpec')} onChange={(e) => updateProd('batchLotTestedNotWithinSpec', e.target.checked)} />
                Batch and lot tested and found not within specifications
              </label>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={getProdCheckbox('counterfeit')} onChange={(e) => updateProd('counterfeit', e.target.checked)} />
                Counterfeit
              </label>
            </div>
          </div>
        </section>
      </>
    );
  };


  return (
    <div className="case-form-container">
      <div className="case-form-header">
        <div className="header-left">
          <h1>Case Form</h1>
          <div className="header-case-info">
            <div className="header-field">
              <label>Case Number:</label>
              <span>{getValue('caseNumber') || 'Auto-generated'}</span>
            </div>
            <div className="header-field">
              <label>Case Priority:</label>
              <select value={getValue('casePriority')} onChange={(e) => handleInputChange('casePriority', e.target.value)}>
                <option value="">Select</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="header-field">
              <label>Case Status:</label>
              <select value={getValue('caseStatus')} onChange={(e) => handleInputChange('caseStatus', e.target.value)}>
                <option value="">Select</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="header-field">
              <label>Case Processing Indicator:</label>
              <select value={getValue('caseProcessingIndicator')} onChange={(e) => handleInputChange('caseProcessingIndicator', e.target.value)}>
                <option value="">Select</option>
                <option value="initial">Initial</option>
                <option value="follow-up">Follow-up</option>
                <option value="amendment">Amendment</option>
              </select>
            </div>
          </div>
        </div>
        <div className="case-form-actions">
          <button className="btn-secondary">Cancel</button>
          <button className="btn-primary">Save</button>
          <button className="btn-primary">Submit</button>
        </div>
      </div>

      <div className="case-form-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="case-form-content">
        {activeTab === 'general' && (
          <div className="tab-content">
            <h2>General Tab</h2>
            
            <section className="form-section">
              <h3>Case Identification</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Case Number</label>
                  <input type="text" value={getValue('caseNumber')} readOnly placeholder="Auto-generated" />
                </div>
                <div className="form-group">
                  <label>Case Priority</label>
                  <select value={getValue('casePriority')} onChange={(e) => handleInputChange('casePriority', e.target.value)}>
                    <option value="">Select Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Case Status</label>
                  <select value={getValue('caseStatus')} onChange={(e) => handleInputChange('caseStatus', e.target.value)}>
                    <option value="">Select Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Case Type</label>
                  <select value={getValue('caseType')} onChange={(e) => handleInputChange('caseType', e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="spontaneous">Spontaneous</option>
                    <option value="study">Study</option>
                    <option value="literature">Literature</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Initial Receipt Date</label>
                  <input type="date" value={getValue('initialReceiptDate')} onChange={(e) => handleInputChange('initialReceiptDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Follow-up Receipt Date</label>
                  <input type="date" value={getValue('followupReceiptDate')} onChange={(e) => handleInputChange('followupReceiptDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Country of Occurrence</label>
                  <input type="text" value={getValue('countryOfOccurrence')} onChange={(e) => handleInputChange('countryOfOccurrence', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Reporter Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Reporter First Name</label>
                  <input type="text" value={getValue('reporterFirstName')} onChange={(e) => handleInputChange('reporterFirstName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Reporter Last Name</label>
                  <input type="text" value={getValue('reporterLastName')} onChange={(e) => handleInputChange('reporterLastName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Reporter Type</label>
                  <select value={getValue('reporterType')} onChange={(e) => handleInputChange('reporterType', e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="consumer">Consumer</option>
                    <option value="hcp">HCP</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Occupation</label>
                  <input type="text" value={getValue('occupation')} onChange={(e) => handleInputChange('occupation', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Health Care Professional</label>
                  <select value={getValue('healthCareProfessional')} onChange={(e) => handleInputChange('healthCareProfessional', e.target.value)}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Institution</label>
                  <input type="text" value={getValue('institution')} onChange={(e) => handleInputChange('institution', e.target.value)} />
                </div>
                <div className="form-group full-width">
                  <label>Reporter Address</label>
                  <input type="text" value={getValue('reporterAddress')} onChange={(e) => handleInputChange('reporterAddress', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input type="text" value={getValue('city')} onChange={(e) => handleInputChange('city', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" value={getValue('state')} onChange={(e) => handleInputChange('state', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input type="text" value={getValue('country')} onChange={(e) => handleInputChange('country', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="tel" value={getValue('phone')} onChange={(e) => handleInputChange('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={getValue('email')} onChange={(e) => handleInputChange('email', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Study Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Study ID</label>
                  <input type="text" value={getValue('studyId')} onChange={(e) => handleInputChange('studyId', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Study Name</label>
                  <input type="text" value={getValue('studyName')} onChange={(e) => handleInputChange('studyName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Study Phase</label>
                  <input type="text" value={getValue('studyPhase')} onChange={(e) => handleInputChange('studyPhase', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Study Type</label>
                  <select value={getValue('studyType')} onChange={(e) => handleInputChange('studyType', e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="blinded">Blinded</option>
                    <option value="not-blinded">Not Blinded</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Center ID</label>
                  <input type="text" value={getValue('centerId')} onChange={(e) => handleInputChange('centerId', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Sponsor</label>
                  <input type="text" value={getValue('sponsor')} onChange={(e) => handleInputChange('sponsor', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Confidentiality</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Protect Confidentiality</label>
                  <select value={getValue('protectConfidentiality')} onChange={(e) => handleInputChange('protectConfidentiality', e.target.value)}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Primary Reporter</label>
                  <select value={getValue('primaryReporter')} onChange={(e) => handleInputChange('primaryReporter', e.target.value)}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Correspondence Contact</label>
                  <select value={getValue('correspondenceContact')} onChange={(e) => handleInputChange('correspondenceContact', e.target.value)}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'patient' && (
          <div className="tab-content">
            <div className="patient-header">
              <h2>Patient Tab</h2>
              <div className="patient-header-buttons">
                <button className="btn-icon" title="Patient Info From Reporter">
                  <ClipboardIcon /> Patient Info From Reporter
                </button>
                <button className="btn-icon" title="Current Medical Status">
                  <HospitalIcon /> Current Medical Status
                </button>
                <button className="btn-icon" title="Language Selector">
                  <GlobeIcon />
                </button>
              </div>
            </div>

            <div className="sub-tabs">
              <button
                className={`sub-tab-button ${patientSubTab === 'patient' ? 'active' : ''}`}
                onClick={() => setPatientSubTab('patient')}
              >
                Patient
              </button>
              <button
                className={`sub-tab-button ${patientSubTab === 'parent' ? 'active' : ''}`}
                onClick={() => setPatientSubTab('parent')}
              >
                Parent
              </button>
            </div>

            {patientSubTab === 'patient' && (
              <>
                <section className="form-section">
                  <h3>1. Patient Information</h3>
                  
                  <div className="form-subsection">
                    <h4>Identification</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Sponsor Identifier</label>
                        <input type="text" value={getValue('sponsorIdentifier')} onChange={(e) => handleInputChange('sponsorIdentifier', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Patient ID (Pat. ID)</label>
                        <input type="text" value={getValue('patientId')} onChange={(e) => handleInputChange('patientId', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Randomization #</label>
                        <input type="text" value={getValue('randomizationNumber')} onChange={(e) => handleInputChange('randomizationNumber', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="form-subsection">
                    <h4>Name Details</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Title</label>
                        <select value={getValue('patientTitle')} onChange={(e) => handleInputChange('patientTitle', e.target.value)}>
                          <option value="">Select Title</option>
                          <option value="mr">Mr.</option>
                          <option value="mrs">Mrs.</option>
                          <option value="ms">Ms.</option>
                          <option value="dr">Dr.</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>First Name</label>
                        <input type="text" value={getValue('patientFirstName')} onChange={(e) => handleInputChange('patientFirstName', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Middle Initial (MI)</label>
                        <input type="text" maxLength="1" value={getValue('patientMiddleInitial')} onChange={(e) => handleInputChange('patientMiddleInitial', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input type="text" value={getValue('patientLastName')} onChange={(e) => handleInputChange('patientLastName', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Initials</label>
                        <input type="text" value={getValue('patientInitials')} onChange={(e) => handleInputChange('patientInitials', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="form-subsection">
                    <h4>Privacy & Case Type</h4>
                    <div className="form-grid">
                      <div className="form-group checkbox-group">
                        <label>
                          <input type="checkbox" checked={getCheckboxValue('protectConfidentiality')} onChange={(e) => handleInputChange('protectConfidentiality', e.target.checked)} />
                          Protect Confidentiality
                        </label>
                      </div>
                      <div className="form-group checkbox-group">
                        <label>
                          <input type="checkbox" checked={getCheckboxValue('childOnlyCase')} onChange={(e) => handleInputChange('childOnlyCase', e.target.checked)} />
                          Child Only Case
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-subsection">
                    <h4>Address Details</h4>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Address Line 1</label>
                        <input type="text" value={getValue('patientAddressLine1')} onChange={(e) => handleInputChange('patientAddressLine1', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>City</label>
                        <input type="text" value={getValue('patientCity')} onChange={(e) => handleInputChange('patientCity', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input type="text" value={getValue('patientState')} onChange={(e) => handleInputChange('patientState', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Postal Code</label>
                        <input type="text" value={getValue('patientPostalCode')} onChange={(e) => handleInputChange('patientPostalCode', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Country</label>
                        <input type="text" value={getValue('patientCountry')} onChange={(e) => handleInputChange('patientCountry', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input type="tel" value={getValue('patientPhoneNumber')} onChange={(e) => handleInputChange('patientPhoneNumber', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" value={getValue('patientEmailAddress')} onChange={(e) => handleInputChange('patientEmailAddress', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <h3>2. Patient Details</h3>
                  
                  <div className="form-subsection">
                    <h4>Birth & Age</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input type="date" value={getValue('dateOfBirth')} onChange={(e) => handleInputChange('dateOfBirth', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Age</label>
                        <input type="number" value={getValue('age')} onChange={(e) => handleInputChange('age', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Units</label>
                        <select value={getValue('ageUnit')} onChange={(e) => handleInputChange('ageUnit', e.target.value)}>
                          <option value="">Select Unit</option>
                          <option value="years">Years</option>
                          <option value="months">Months</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Age Group</label>
                        <input type="text" value={getValue('ageGroup')} onChange={(e) => handleInputChange('ageGroup', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="form-subsection">
                    <h4>Physical Measurements</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Height</label>
                        <input type="number" value={getValue('height')} onChange={(e) => handleInputChange('height', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Weight</label>
                        <input type="number" value={getValue('weight')} onChange={(e) => handleInputChange('weight', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>BMI (auto-calculated)</label>
                        <input type="text" value={getValue('bmi') || (getValue('height') && getValue('weight') ? (parseFloat(getValue('weight')) / Math.pow(parseFloat(getValue('height')) / 100, 2)).toFixed(2) : '')} readOnly />
                      </div>
                    </div>
                  </div>

                  <div className="form-subsection">
                    <h4>Gender & Pregnancy</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Gender</label>
                        <select value={getValue('gender')} onChange={(e) => handleInputChange('gender', e.target.value)}>
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Pregnant</label>
                        <select value={getValue('pregnant')} onChange={(e) => handleInputChange('pregnant', e.target.value)}>
                          <option value="">Select</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                          <option value="unknown">Unknown</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Date of LMP</label>
                        <input type="date" value={getValue('dateOfLMP')} onChange={(e) => handleInputChange('dateOfLMP', e.target.value)} />
                      </div>
                      <div className="form-group checkbox-group">
                        <label>
                          <input type="checkbox" checked={getCheckboxValue('breastfeeding')} onChange={(e) => handleInputChange('breastfeeding', e.target.checked)} />
                          Breastfeeding
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-subsection">
                    <h4>Other Demographics</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Occupation</label>
                        <input type="text" value={getValue('patientOccupation')} onChange={(e) => handleInputChange('patientOccupation', e.target.value)} />
                      </div>
                      <div className="form-group full-width">
                        <label>Patient (Free text)</label>
                        <textarea rows="4" value={getValue('patientFreeText')} onChange={(e) => handleInputChange('patientFreeText', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Other Specify</label>
                        <input type="text" value={getValue('otherSpecify')} onChange={(e) => handleInputChange('otherSpecify', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="form-subsection">
                    <h4>Other Relevant History</h4>
                    <div className="medical-history-container">
                      <div className="medical-history-header">
                        <h5>Other Relevant History ({medicalHistoryRows.length})</h5>
                        <div className="history-action-buttons">
                          <button 
                            className="btn-small"
                            onClick={() => {
                              if (selectedRowId && medicalHistoryRows.length > 0) {
                                const selectedRow = medicalHistoryRows.find(r => r.id === selectedRowId);
                                if (selectedRow) {
                                  const maxId = medicalHistoryRows.length > 0 ? Math.max(...medicalHistoryRows.map(r => r.id)) : 0;
                                  const newRow = { 
                                    ...selectedRow, 
                                    id: maxId + 1,
                                    pt: '', // Reset coding when copying
                                    llt: ''
                                  };
                                  const index = medicalHistoryRows.findIndex(r => r.id === selectedRowId);
                                  setMedicalHistoryRows([...medicalHistoryRows.slice(0, index + 1), newRow, ...medicalHistoryRows.slice(index + 1)]);
                                  setSelectedRowId(newRow.id);
                                }
                              }
                            }}
                            disabled={!selectedRowId || medicalHistoryRows.length === 0}
                          >
                            Copy
                          </button>
                          <button 
                            className="btn-small"
                            onClick={() => {
                              const maxId = medicalHistoryRows.length > 0 ? Math.max(...medicalHistoryRows.map(r => r.id)) : 0;
                              const newRow = { 
                                id: maxId + 1,
                                startDate: '',
                                stopDate: '',
                                ongoing: false,
                                age: '',
                                ageUnits: '',
                                conditionType: '',
                                verbatimTerm: '',
                                familyHistory: false,
                                pt: '',
                                llt: '',
                                notes: '',
                                language: '',
                                source: ''
                              };
                              setMedicalHistoryRows([...medicalHistoryRows, newRow]);
                              setSelectedRowId(newRow.id);
                            }}
                          >
                            Add
                          </button>
                          <button 
                            className="btn-small btn-danger"
                            onClick={() => {
                              if (selectedRowId && medicalHistoryRows.length > 1) {
                                setMedicalHistoryRows(medicalHistoryRows.filter(r => r.id !== selectedRowId));
                                setSelectedRowId(null);
                              }
                            }}
                            disabled={!selectedRowId || medicalHistoryRows.length === 1}
                          >
                            Delete
                          </button>
                          <button 
                            className="btn-small"
                            onClick={() => {
                              if (selectedRowId) {
                                const index = medicalHistoryRows.findIndex(r => r.id === selectedRowId);
                                if (index > 0) {
                                  const newRows = [...medicalHistoryRows];
                                  [newRows[index - 1], newRows[index]] = [newRows[index], newRows[index - 1]];
                                  setMedicalHistoryRows(newRows);
                                }
                              }
                            }}
                            disabled={!selectedRowId || medicalHistoryRows.findIndex(r => r.id === selectedRowId) === 0}
                          >
                            ↑
                          </button>
                          <button 
                            className="btn-small"
                            onClick={() => {
                              if (selectedRowId) {
                                const index = medicalHistoryRows.findIndex(r => r.id === selectedRowId);
                                if (index < medicalHistoryRows.length - 1) {
                                  const newRows = [...medicalHistoryRows];
                                  [newRows[index], newRows[index + 1]] = [newRows[index + 1], newRows[index]];
                                  setMedicalHistoryRows(newRows);
                                }
                              }
                            }}
                            disabled={!selectedRowId || medicalHistoryRows.findIndex(r => r.id === selectedRowId) === medicalHistoryRows.length - 1}
                          >
                            ↓
                          </button>
                        </div>
                      </div>

                      <div className="medical-history-table">
                        <div className="history-table-header">
                          <div className="history-col-timeline">Start/Stop/Age</div>
                          <div className="history-col-condition">Condition Info</div>
                          <div className="history-col-coding">MedDRA Coding</div>
                          <div className="history-col-notes">Notes</div>
                        </div>

                        <div className="history-table-body">
                          {medicalHistoryRows.map((row) => {
                            const rowData = row;
                            const isSelected = selectedRowId === row.id;
                            const isOngoing = rowData.ongoing === true;

                            return (
                              <div 
                                key={row.id} 
                                className={`history-table-row ${isSelected ? 'selected' : ''}`}
                                onClick={() => setSelectedRowId(row.id)}
                              >
                                {/* Column 1: Timeline */}
                                <div className="history-col-timeline">
                                  <div className="history-field-group">
                                    <label>Start Date</label>
                                    <input 
                                      type="date" 
                                      value={rowData.startDate || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        updateMedicalHistoryRow(row.id, 'startDate', e.target.value);
                                      }}
                                    />
                                  </div>
                                  <div className="history-field-group">
                                    <label>Stop Date</label>
                                    <input 
                                      type="date" 
                                      value={rowData.stopDate || ''}
                                      disabled={isOngoing}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        updateMedicalHistoryRow(row.id, 'stopDate', e.target.value);
                                      }}
                                    />
                                  </div>
                                  <div className="history-field-group">
                                    <label>
                                      <input 
                                        type="checkbox" 
                                        checked={isOngoing}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          updateMedicalHistoryRow(row.id, 'ongoing', e.target.checked);
                                        }}
                                      />
                                      Ongoing
                                    </label>
                                  </div>
                                  <div className="history-field-group">
                                    <label>Age</label>
                                    <input 
                                      type="number" 
                                      value={rowData.age || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        updateMedicalHistoryRow(row.id, 'age', e.target.value);
                                      }}
                                    />
                                  </div>
                                  <div className="history-field-group">
                                    <label>Age Units</label>
                                    <select 
                                      value={rowData.ageUnits || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        updateMedicalHistoryRow(row.id, 'ageUnits', e.target.value);
                                      }}
                                    >
                                      <option value="">Select</option>
                                      <option value="years">Years</option>
                                      <option value="months">Months</option>
                                      <option value="days">Days</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Column 2: Condition Info */}
                                <div className="history-col-condition">
                                  <div className="history-field-group">
                                    <label>Condition Type</label>
                                    <select 
                                      value={rowData.conditionType || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        updateMedicalHistoryRow(row.id, 'conditionType', e.target.value);
                                      }}
                                    >
                                      <option value="">Select Type</option>
                                      <option value="medical-history">Medical History</option>
                                      <option value="concomitant-condition">Concomitant Condition</option>
                                      <option value="past-medical-history">Past Medical History</option>
                                    </select>
                                  </div>
                                  <div className="history-field-group">
                                    <label>Verbatim Term</label>
                                    <input 
                                      type="text" 
                                      value={rowData.verbatimTerm || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        updateMedicalHistoryRow(row.id, 'verbatimTerm', e.target.value);
                                      }}
                                    />
                                  </div>
                                  <div className="history-field-group">
                                    <button 
                                      className="btn-encode"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEncodeRowId(row.id);
                                        setEncodeSearchTerm(row.verbatimTerm || '');
                                        setShowEncodeModal(true);
                                      }}
                                    >
                                      Encode
                                    </button>
                                  </div>
                                  <div className="history-field-group">
                                    <label>
                                      <input 
                                        type="checkbox" 
                                        checked={rowData.familyHistory === true}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          updateMedicalHistoryRow(row.id, 'familyHistory', e.target.checked);
                                        }}
                                      />
                                      Family History
                                    </label>
                                  </div>
                                </div>

                                {/* Column 3: MedDRA Coding */}
                                <div className="history-col-coding">
                                  <div className="history-field-group">
                                    <label>PT (Preferred Term)</label>
                                    <input 
                                      type="text" 
                                      value={rowData.pt || ''}
                                      readOnly
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="history-field-group">
                                    <label>LLT (Lower Level Term)</label>
                                    <input 
                                      type="text" 
                                      value={rowData.llt || ''}
                                      readOnly
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <div className="history-field-group">
                                    <button 
                                      className="btn-small btn-success"
                                      disabled={!rowData.pt && !rowData.llt}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Confirm coding - coding is already saved in state
                                      }}
                                    >
                                      Confirm
                                    </button>
                                    <button 
                                      className="btn-small btn-danger"
                                      disabled={!rowData.pt && !rowData.llt}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateMedicalHistoryRow(row.id, 'pt', '');
                                        updateMedicalHistoryRow(row.id, 'llt', '');
                                      }}
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>

                                {/* Column 4: Notes */}
                                <div className="history-col-notes">
                                  <div className="history-field-group">
                                    <label>Notes</label>
                                    <textarea 
                                      rows="4"
                                      value={rowData.notes || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        updateMedicalHistoryRow(row.id, 'notes', e.target.value);
                                      }}
                                    />
                                  </div>
                                  <div className="history-field-group">
                                    <label>Language</label>
                                    <select 
                                      value={rowData.language || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        updateMedicalHistoryRow(row.id, 'language', e.target.value);
                                      }}
                                    >
                                      <option value="">Select Language</option>
                                      <option value="en">English</option>
                                      <option value="es">Spanish</option>
                                      <option value="fr">French</option>
                                      <option value="de">German</option>
                                    </select>
                                  </div>
                                  <div className="history-field-group">
                                    <label>Source</label>
                                    <input 
                                      type="text" 
                                      value={rowData.source || ''}
                                      placeholder="Source icon/ref"
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        updateMedicalHistoryRow(row.id, 'source', e.target.value);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <h3>3. Concomitant Therapy</h3>
                  <div className="form-grid">
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getCheckboxValue('concomitantTherapyAdministered')} onChange={(e) => handleInputChange('concomitantTherapyAdministered', e.target.checked)} />
                        Concomitant Therapy Administered
                      </label>
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <div className="form-section-sidebar">
                    <div className="form-section-main">
                      <h3>4. Race Information</h3>
                      <div className="race-list-container">
                        <div className="race-list-header">
                          <h4>Race Information</h4>
                          <button 
                            className="btn-small"
                            onClick={() => {
                              const newRace = prompt('Enter race:');
                              if (newRace) {
                                setRaceList([...raceList, newRace]);
                              }
                            }}
                          >
                            Add
                          </button>
                        </div>
                        <div className="race-list">
                          {raceList.length === 0 ? (
                            <p className="empty-list">No race information added</p>
                          ) : (
                            raceList.map((race, index) => (
                              <div key={index} className="race-list-item">
                                <span>{race}</span>
                                <button 
                                  className="btn-small btn-danger"
                                  onClick={() => setRaceList(raceList.filter((_, i) => i !== index))}
                                >
                                  Delete
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <h3>5. Event Death Details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Date of Death</label>
                      <input type="date" value={getValue('dateOfDeath')} onChange={(e) => handleInputChange('dateOfDeath', e.target.value)} />
                    </div>
                    <div className="form-group full-width">
                      <label>Cause of Death</label>
                      <textarea rows="4" value={getValue('causeOfDeath')} onChange={(e) => handleInputChange('causeOfDeath', e.target.value)} />
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getCheckboxValue('autopsyPerformed')} onChange={(e) => handleInputChange('autopsyPerformed', e.target.checked)} />
                        Autopsy Performed
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getCheckboxValue('autopsyResultsAvailable')} onChange={(e) => handleInputChange('autopsyResultsAvailable', e.target.checked)} />
                        Autopsy Results Available
                      </label>
                    </div>
                  </div>
                </section>
              </>
            )}

            {patientSubTab === 'parent' && (
              <div className="tab-content">
                <section className="form-section">
                  <h3>Parent Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Parent Title</label>
                      <select value={getValue('parentTitle')} onChange={(e) => handleInputChange('parentTitle', e.target.value)}>
                        <option value="">Select Title</option>
                        <option value="mr">Mr.</option>
                        <option value="mrs">Mrs.</option>
                        <option value="ms">Ms.</option>
                        <option value="dr">Dr.</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Parent First Name</label>
                      <input type="text" value={getValue('parentFirstName')} onChange={(e) => handleInputChange('parentFirstName', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Parent Middle Initial</label>
                      <input type="text" maxLength="1" value={getValue('parentMiddleInitial')} onChange={(e) => handleInputChange('parentMiddleInitial', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Parent Last Name</label>
                      <input type="text" value={getValue('parentLastName')} onChange={(e) => handleInputChange('parentLastName', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Relationship to Patient</label>
                      <select value={getValue('parentRelationship')} onChange={(e) => handleInputChange('parentRelationship', e.target.value)}>
                        <option value="">Select Relationship</option>
                        <option value="father">Father</option>
                        <option value="mother">Mother</option>
                        <option value="guardian">Guardian</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Parent Phone Number</label>
                      <input type="tel" value={getValue('parentPhoneNumber')} onChange={(e) => handleInputChange('parentPhoneNumber', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Parent Email Address</label>
                      <input type="email" value={getValue('parentEmailAddress')} onChange={(e) => handleInputChange('parentEmailAddress', e.target.value)} />
                    </div>
                    <div className="form-group full-width">
                      <label>Parent Address</label>
                      <input type="text" value={getValue('parentAddress')} onChange={(e) => handleInputChange('parentAddress', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Parent City</label>
                      <input type="text" value={getValue('parentCity')} onChange={(e) => handleInputChange('parentCity', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Parent State</label>
                      <input type="text" value={getValue('parentState')} onChange={(e) => handleInputChange('parentState', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Parent Postal Code</label>
                      <input type="text" value={getValue('parentPostalCode')} onChange={(e) => handleInputChange('parentPostalCode', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Parent Country</label>
                      <input type="text" value={getValue('parentCountry')} onChange={(e) => handleInputChange('parentCountry', e.target.value)} />
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="tab-content">
            <div className="products-header">
              <div className="products-header-left">
                <h2>Products Tab</h2>
                <p className="static-mode-note">📌 Static Mode: Fixed product tabs for demo/UI purposes</p>
              </div>
              <button className="btn-primary" onClick={addProduct}>
                Add Product
              </button>
            </div>

            {/* STATIC Product Sub-tabs - Always visible, fixed labels */}
            <div className="product-sub-tabs">
              {staticProducts.map((product) => (
                <button
                  key={product.id}
                  className={`product-sub-tab ${activeProductId === product.id ? 'active' : ''}`}
                  onClick={() => setActiveProductId(product.id)}
                >
                  {product.name}
                </button>
              ))}
            </div>

            {/* Product Content - Same structure for all static tabs */}
            <div className="product-content">
              {renderProductContent(activeProductId)}
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="tab-content">
            <div className="products-header">
              <div className="products-header-left">
                <h2>Events Tab</h2>
              </div>
              <button className="btn-primary" onClick={addEvent}>
                Add Event
              </button>
            </div>

            {/* Event Selection Tabs */}
            <div className="product-sub-tabs">
              {events.map((event) => (
                <button
                  key={event.id}
                  className={`product-sub-tab ${activeEventId === event.id ? 'active' : ''}`}
                  onClick={() => setActiveEventId(event.id)}
                >
                  {event.term} <span className="event-status-badge">{event.status}</span>
                </button>
              ))}
            </div>

            {/* Event Sub-tabs Navigation */}
            <div className="product-sub-tabs" style={{ marginTop: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
              <button
                className={`product-sub-tab ${eventSubTab === 'event' ? 'active' : ''}`}
                onClick={() => setEventSubTab('event')}
              >
                Event
              </button>
              <button
                className={`product-sub-tab ${eventSubTab === 'assessment' ? 'active' : ''}`}
                onClick={() => setEventSubTab('assessment')}
              >
                Event Assessment
              </button>
              <button
                className={`product-sub-tab ${eventSubTab === 'product-event-details' ? 'active' : ''}`}
                onClick={() => setEventSubTab('product-event-details')}
              >
                Product – Event Details
              </button>
            </div>

            {/* Sub-tab 1: EVENT */}
            {eventSubTab === 'event' && (
              <div className="product-content">

                {/* A. Event Identification */}
                <section className="form-section">
                  <h3>A. Event Identification</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Event Term Display</label>
                      <input type="text" value={getEventValue('eventTerm')} onChange={(e) => updateEvent('eventTerm', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Event Status</label>
                      <select value={getEventValue('eventStatus') || 'New'} onChange={(e) => updateEvent('eventStatus', e.target.value)}>
                        <option value="New">New</option>
                        <option value="Existing">Existing</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* B. Event Information */}
                <section className="form-section">
                  <h3>B. Event Information</h3>
                  
                  <div className="form-subsection">
                    <h4>Description</h4>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label>Description as Reported</label>
                        <textarea rows="3" value={getEventValue('descriptionAsReported')} onChange={(e) => updateEvent('descriptionAsReported', e.target.value)} />
                      </div>
                      <div className="form-group full-width">
                        <label>Description to be Coded</label>
                        <div className="input-with-button">
                          <textarea rows="3" value={getEventValue('descriptionToBeCoded')} onChange={(e) => updateEvent('descriptionToBeCoded', e.target.value)} />
                          <button className="btn-small" type="button">Encode</button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Original Language</label>
                        <input type="text" value={getEventValue('originalLanguage')} onChange={(e) => updateEvent('originalLanguage', e.target.value)} />
                      </div>
                      <div className="form-group radio-group">
                        <label>
                          <input 
                            type="radio" 
                            name={`eventType-${activeEventId}`} 
                            value="diagnosis"
                            checked={getEventValue('diagnosisSymptoms') === 'diagnosis'}
                            onChange={(e) => updateEvent('diagnosisSymptoms', e.target.value)}
                          />
                          Diagnosis
                        </label>
                        <label>
                          <input 
                            type="radio" 
                            name={`eventType-${activeEventId}`} 
                            value="symptoms"
                            checked={getEventValue('diagnosisSymptoms') === 'symptoms'}
                            onChange={(e) => updateEvent('diagnosisSymptoms', e.target.value)}
                          />
                          Symptoms
                        </label>
                      </div>
                      <div className="form-group checkbox-group">
                        <label>
                          <input type="checkbox" checked={getEventCheckboxValue('medicalConfirmationByHCP')} onChange={(e) => updateEvent('medicalConfirmationByHCP', e.target.checked)} />
                          Medical Confirmation by HCP
                        </label>
                      </div>
                      <div className="form-group checkbox-group">
                        <label>
                          <input type="checkbox" checked={getEventCheckboxValue('termHighlightedByReporter')} onChange={(e) => updateEvent('termHighlightedByReporter', e.target.checked)} />
                          Term Highlighted by Reporter
                        </label>
                      </div>
                    </div>
                  </div>
                </section>

                {/* C. Event Dates & Timeline */}
                <section className="form-section">
                  <h3>C. Event Dates & Timeline</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Onset Date/Time</label>
                      <input type="datetime-local" value={getEventValue('onsetDateTime')} onChange={(e) => updateEvent('onsetDateTime', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Stop Date/Time</label>
                      <input type="datetime-local" value={getEventValue('stopDateTime')} onChange={(e) => updateEvent('stopDateTime', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Onset from Last Dose</label>
                      <input type="text" value={getEventValue('onsetFromLastDose')} onChange={(e) => updateEvent('onsetFromLastDose', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Duration</label>
                      <input type="text" value={getEventValue('duration')} onChange={(e) => updateEvent('duration', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Onset Latency</label>
                      <input type="text" value={getEventValue('onsetLatency')} onChange={(e) => updateEvent('onsetLatency', e.target.value)} />
                    </div>
                  </div>
                </section>

                {/* D. Receipt & Outcome */}
                <section className="form-section">
                  <h3>D. Receipt & Outcome</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Receipt Date</label>
                      <input type="date" value={getEventValue('receiptDate')} onChange={(e) => updateEvent('receiptDate', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Patient Has Prior History?</label>
                      <select value={getEventValue('patientHasPriorHistory')} onChange={(e) => updateEvent('patientHasPriorHistory', e.target.value)}>
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Treatment Received?</label>
                      <select value={getEventValue('treatmentReceived')} onChange={(e) => updateEvent('treatmentReceived', e.target.value)}>
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Outcome of Event</label>
                      <select value={getEventValue('outcomeOfEvent')} onChange={(e) => updateEvent('outcomeOfEvent', e.target.value)}>
                        <option value="">Select</option>
                        <option value="recovered">Recovered</option>
                        <option value="recovering">Recovering</option>
                        <option value="not-recovered">Not Recovered</option>
                        <option value="recovered-with-sequelae">Recovered with Sequelae</option>
                        <option value="fatal">Fatal</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* E. Event Coding (MedDRA) */}
                <section className="form-section">
                  <h3>E. Event Coding (MedDRA)</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>SOC</label>
                      <input type="text" value={getEventValue('soc')} readOnly />
                    </div>
                    <div className="form-group">
                      <label>HLGT</label>
                      <input type="text" value={getEventValue('hlgt')} readOnly />
                    </div>
                    <div className="form-group">
                      <label>HLT</label>
                      <input type="text" value={getEventValue('hlt')} readOnly />
                    </div>
                    <div className="form-group">
                      <label>PT</label>
                      <input type="text" value={getEventValue('pt')} readOnly />
                    </div>
                    <div className="form-group">
                      <label>LLT</label>
                      <input type="text" value={getEventValue('llt')} readOnly />
                    </div>
                    <div className="form-group">
                      <label>Synonym</label>
                      <input type="text" value={getEventValue('synonym')} onChange={(e) => updateEvent('synonym', e.target.value)} />
                    </div>
                  </div>
                </section>

                {/* F. Event Characteristics */}
                <section className="form-section">
                  <h3>F. Event Characteristics</h3>
                  <div className="form-grid">
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('lackOfEfficacy')} onChange={(e) => updateEvent('lackOfEfficacy', e.target.checked)} />
                        Lack of Efficacy
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('progressionOfDisease')} onChange={(e) => updateEvent('progressionOfDisease', e.target.checked)} />
                        Progression of Disease
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('adverseDrugWithdrawalReaction')} onChange={(e) => updateEvent('adverseDrugWithdrawalReaction', e.target.checked)} />
                        Adverse Drug Withdrawal Reaction
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('infection')} onChange={(e) => updateEvent('infection', e.target.checked)} />
                        Infection
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('droppedFromStudy')} onChange={(e) => updateEvent('droppedFromStudy', e.target.checked)} />
                        Dropped from Study
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('emergencyRoomVisit')} onChange={(e) => updateEvent('emergencyRoomVisit', e.target.checked)} />
                        Emergency Room Visit
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('physicianOfficeVisit')} onChange={(e) => updateEvent('physicianOfficeVisit', e.target.checked)} />
                        Physician Office Visit
                      </label>
                    </div>
                  </div>
                </section>

                {/* G. Seriousness Criteria */}
                <section className="form-section">
                  <h3>G. Seriousness Criteria</h3>
                  <div className="form-grid">
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('seriousnessDeath')} onChange={(e) => updateEvent('seriousnessDeath', e.target.checked)} />
                        Death
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('seriousnessLifeThreatening')} onChange={(e) => updateEvent('seriousnessLifeThreatening', e.target.checked)} />
                        Life-Threatening
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('seriousnessHospitalization')} onChange={(e) => updateEvent('seriousnessHospitalization', e.target.checked)} />
                        Hospitalization
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('seriousnessDisability')} onChange={(e) => updateEvent('seriousnessDisability', e.target.checked)} />
                        Disability
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('seriousnessCongenitalAnomaly')} onChange={(e) => updateEvent('seriousnessCongenitalAnomaly', e.target.checked)} />
                        Congenital Anomaly
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('seriousnessMedicallySignificant')} onChange={(e) => updateEvent('seriousnessMedicallySignificant', e.target.checked)} />
                        Medically Significant
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getEventCheckboxValue('seriousnessInterventionRequired')} onChange={(e) => updateEvent('seriousnessInterventionRequired', e.target.checked)} />
                        Intervention Required
                      </label>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Sub-tab 2: EVENT ASSESSMENT */}
            {eventSubTab === 'assessment' && (
              <div className="product-content">
                <section className="form-section">
                  <h3>Event Assessment</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Serious? (Yes/No)</label>
                      <select value={getEventValue('assessmentSerious')} onChange={(e) => updateEvent('assessmentSerious', e.target.value)}>
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>IME (Important Medical Event)? (Yes/No)</label>
                      <select value={getEventValue('assessmentIME')} onChange={(e) => updateEvent('assessmentIME', e.target.value)}>
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Treatment Received? (Yes/No)</label>
                      <select value={getEventValue('assessmentTreatmentReceived')} onChange={(e) => updateEvent('assessmentTreatmentReceived', e.target.value)}>
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Outcome Reviewed</label>
                      <select value={getEventValue('outcomeReviewed')} onChange={(e) => updateEvent('outcomeReviewed', e.target.value)}>
                        <option value="">Select</option>
                        <option value="recovered">Recovered</option>
                        <option value="recovering">Recovering</option>
                        <option value="not-recovered">Not Recovered</option>
                        <option value="recovered-with-sequelae">Recovered with Sequelae</option>
                        <option value="fatal">Fatal</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Reason for IME Downgrade</label>
                      <input type="text" value={getEventValue('reasonForIMEDowngrade')} onChange={(e) => updateEvent('reasonForIMEDowngrade', e.target.value)} />
                    </div>
                    <div className="form-group full-width">
                      <label>IME Downgrade Description</label>
                      <textarea rows="3" value={getEventValue('imeDowngradeDescription')} onChange={(e) => updateEvent('imeDowngradeDescription', e.target.value)} />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Sub-tab 3: PRODUCT – EVENT DETAILS */}
            {eventSubTab === 'product-event-details' && (
              <div className="product-content">
                {/* CENTER COLUMN: EVENT ↔ DRUG RELATIONSHIP PANEL (Dynamic Table) */}
                <section className="form-section">
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Drug Role (DR)</th>
                          <th>Event PT / LLT</th>
                          <th>Causality as Reported</th>
                          <th>Causality as Determined</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productEventCombinations.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="empty-table" style={{ textAlign: 'center', padding: '2rem' }}>
                              No relationships found. Add events and products to see combinations.
                            </td>
                          </tr>
                        ) : (
                          productEventCombinations.map(combo => {
                            const relationship = productEventRelationships[combo.key] || {};
                            const causalityReported = relationship.causalityAsReported || 'Not Reported';
                            const causalityDetermined = relationship.causalityAsDetermined || 'Not Reported';
                            const drugRole = relationship.drugRole || 'Not Set';
                            const isSelected = selectedProductEventPair === combo.key;
                            
                            return (
                              <tr 
                                key={combo.key}
                                onClick={() => {
                                  setSelectedProductEventPair(combo.key);
                                }}
                                style={{ 
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = '#f5f5f5';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <td style={{ fontWeight: 500 }}>{combo.productName}</td>
                                <td>{drugRole}</td>
                                <td>{combo.eventPT} / {combo.eventLLT}</td>
                                <td>{causalityReported}</td>
                                <td>{causalityDetermined}</td>
                                <td>
                                  <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '12px',
                                    fontSize: '0.85rem',
                                    backgroundColor: causalityReported === 'Not Reported' ? '#f0f0f0' : '#d4edda',
                                    color: causalityReported === 'Not Reported' ? '#666' : '#155724'
                                  }}>
                                    {causalityReported === 'Not Reported' ? '⚠️ Not Reported' : '✓ Linked'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 5.2 Product Selection */}
                <section className="form-section">
                  <h3>5.2 Product Selection</h3>
                  {selectedProductEventPair ? (
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px' }}>
                      <strong>✓ Selected:</strong> {(() => {
                        const [productId, eventId] = selectedProductEventPair.split('-');
                        const product = staticProducts.find(p => p.id === productId);
                        const event = events.find(e => e.id === eventId);
                        return `${product?.name || 'Unknown'} ↔ ${event?.term || 'Unknown'}`;
                      })()}
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
                      ⚠️ <strong>No combination selected.</strong> Please select a Product ↔ Event combination from the relationship panel above to view/edit details.
                    </div>
                  )}
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Product Name</label>
                      <select 
                        value={selectedProductEventPair ? (() => {
                          const [productId] = selectedProductEventPair.split('-');
                          return productId || '';
                        })() : ''} 
                        onChange={(e) => {
                          // Update the relationship
                          if (selectedProductEventPair && e.target.value) {
                            updateRelationship('productId', e.target.value);
                          }
                        }}
                        disabled={!selectedProductEventPair}
                      >
                        <option value="">Select Product</option>
                        {staticProducts.map(product => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Drug Role</label>
                      <select value={getRelationshipValue('drugRole')} onChange={(e) => updateRelationship('drugRole', e.target.value)} disabled={!selectedProductEventPair}>
                        <option value="">Select</option>
                        <option value="suspect">Suspect</option>
                        <option value="concomitant">Concomitant</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Event PT / LLT</label>
                      <input 
                        type="text" 
                        value={(() => {
                          if (!selectedProductEventPair) return '';
                          const [, eventId] = selectedProductEventPair.split('-');
                          const eventDataItem = eventData[eventId] || {};
                          return `${eventDataItem.pt || ''} / ${eventDataItem.llt || ''}`;
                        })()} 
                        readOnly
                        style={{ backgroundColor: '#f5f5f5' }}
                      />
                    </div>
                  </div>
                </section>

                {/* 5.3 Causality Assessment */}
                <section className="form-section">
                  <h3>5.3 Causality Assessment</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Causality as Reported</label>
                      <select value={getRelationshipValue('causalityAsReported')} onChange={(e) => updateRelationship('causalityAsReported', e.target.value)} disabled={!selectedProductEventPair}>
                        <option value="">Select</option>
                        <option value="certain">Certain</option>
                        <option value="probable">Probable</option>
                        <option value="possible">Possible</option>
                        <option value="unlikely">Unlikely</option>
                        <option value="conditional">Conditional</option>
                        <option value="unassessable">Unassessable</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Causality as Determined</label>
                      <select value={getRelationshipValue('causalityAsDetermined')} onChange={(e) => updateRelationship('causalityAsDetermined', e.target.value)} disabled={!selectedProductEventPair}>
                        <option value="">Select</option>
                        <option value="certain">Certain</option>
                        <option value="probable">Probable</option>
                        <option value="possible">Possible</option>
                        <option value="unlikely">Unlikely</option>
                        <option value="conditional">Conditional</option>
                        <option value="unassessable">Unassessable</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Other Causality Source</label>
                      <input type="text" value={getRelationshipValue('otherCausalitySource')} onChange={(e) => updateRelationship('otherCausalitySource', e.target.value)} disabled={!selectedProductEventPair} />
                    </div>
                    <div className="form-group">
                      <label>Method (WHO / Company)</label>
                      <select value={getRelationshipValue('causalityMethod')} onChange={(e) => updateRelationship('causalityMethod', e.target.value)} disabled={!selectedProductEventPair}>
                        <option value="">Select</option>
                        <option value="who">WHO</option>
                        <option value="company">Company</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* 5.4 Severity & Action */}
                <section className="form-section">
                  <h3>5.4 Severity & Action</h3>
                  <div className="form-grid">
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getRelationshipValue('mostImportantDiagnosis') === true} onChange={(e) => updateRelationship('mostImportantDiagnosis', e.target.checked)} disabled={!selectedProductEventPair} />
                        Most Important Diagnosis?
                      </label>
                    </div>
                    <div className="form-group checkbox-group">
                      <label>
                        <input type="checkbox" checked={getRelationshipValue('eventMoreSpecificSevereThanPT') === true} onChange={(e) => updateRelationship('eventMoreSpecificSevereThanPT', e.target.checked)} disabled={!selectedProductEventPair} />
                        Event more specific/severe than PT?
                      </label>
                    </div>
                    <div className="form-group">
                      <label>Action Taken</label>
                      <select value={getRelationshipValue('actionTaken')} onChange={(e) => updateRelationship('actionTaken', e.target.value)} disabled={!selectedProductEventPair}>
                        <option value="">Select</option>
                        <option value="dose-reduced">Dose Reduced</option>
                        <option value="dose-increased">Dose Increased</option>
                        <option value="dose-not-changed">Dose Not Changed</option>
                        <option value="drug-withdrawn">Drug Withdrawn</option>
                        <option value="drug-interrupted">Drug Interrupted</option>
                        <option value="drug-increased">Drug Increased</option>
                        <option value="not-applicable">Not Applicable</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* 5.5 Dose Timing */}
                <section className="form-section">
                  <h3>5.5 Dose Timing</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Onset from First Dose</label>
                      <input type="text" value={getRelationshipValue('onsetFromFirstDose')} onChange={(e) => updateRelationship('onsetFromFirstDose', e.target.value)} disabled={!selectedProductEventPair} />
                    </div>
                    <div className="form-group">
                      <label>Onset from Last Dose</label>
                      <input type="text" value={getRelationshipValue('onsetFromLastDoseProduct')} onChange={(e) => updateRelationship('onsetFromLastDoseProduct', e.target.value)} disabled={!selectedProductEventPair} />
                    </div>
                    <div className="form-group">
                      <label>Total Dose to Event</label>
                      <input type="text" value={getRelationshipValue('totalDoseToEvent')} onChange={(e) => updateRelationship('totalDoseToEvent', e.target.value)} disabled={!selectedProductEventPair} />
                    </div>
                    <div className="form-group">
                      <label>Units</label>
                      <input type="text" value={getRelationshipValue('doseUnits')} onChange={(e) => updateRelationship('doseUnits', e.target.value)} disabled={!selectedProductEventPair} />
                    </div>
                  </div>
                </section>

                {/* 5.6 Dechallenge / Rechallenge */}
                <section className="form-section">
                  <h3>5.6 Dechallenge / Rechallenge</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Dechallenge Result</label>
                      <select value={getRelationshipValue('dechallengeResult')} onChange={(e) => updateRelationship('dechallengeResult', e.target.value)} disabled={!selectedProductEventPair}>
                        <option value="">Select</option>
                        <option value="recovered">Recovered</option>
                        <option value="recovering">Recovering</option>
                        <option value="not-recovered">Not Recovered</option>
                        <option value="recovered-with-sequelae">Recovered with Sequelae</option>
                        <option value="fatal">Fatal</option>
                        <option value="unknown">Unknown</option>
                        <option value="not-applicable">Not Applicable</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Rechallenge Result</label>
                      <select value={getRelationshipValue('rechallengeResult')} onChange={(e) => updateRelationship('rechallengeResult', e.target.value)} disabled={!selectedProductEventPair}>
                        <option value="">Select</option>
                        <option value="recurred">Recurred</option>
                        <option value="not-recurred">Not Recurred</option>
                        <option value="unknown">Unknown</option>
                        <option value="not-applicable">Not Applicable</option>
                      </select>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="tab-content">
            <h2>Analysis Tab</h2>
            
            <section className="form-section">
              <h3>Causality Assessment</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Reporter Causality</label>
                  <select value={getValue('reporterCausality')} onChange={(e) => handleInputChange('reporterCausality', e.target.value)}>
                    <option value="">Select</option>
                    <option value="certain">Certain</option>
                    <option value="probable">Probable</option>
                    <option value="possible">Possible</option>
                    <option value="unlikely">Unlikely</option>
                    <option value="conditional">Conditional</option>
                    <option value="unassessable">Unassessable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Company Causality</label>
                  <select value={getValue('companyCausality')} onChange={(e) => handleInputChange('companyCausality', e.target.value)}>
                    <option value="">Select</option>
                    <option value="certain">Certain</option>
                    <option value="probable">Probable</option>
                    <option value="possible">Possible</option>
                    <option value="unlikely">Unlikely</option>
                    <option value="conditional">Conditional</option>
                    <option value="unassessable">Unassessable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Method Used</label>
                  <input type="text" value={getValue('causalityMethod')} onChange={(e) => handleInputChange('causalityMethod', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Listedness</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Listed / Unlisted</label>
                  <select value={getValue('listedness')} onChange={(e) => handleInputChange('listedness', e.target.value)}>
                    <option value="">Select</option>
                    <option value="listed">Listed</option>
                    <option value="unlisted">Unlisted</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Reference Safety Information (RSI)</label>
                  <textarea rows="4" value={getValue('referenceSafetyInfo')} onChange={(e) => handleInputChange('referenceSafetyInfo', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Case Assessment</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Case Seriousness</label>
                  <select value={getValue('caseSeriousness')} onChange={(e) => handleInputChange('caseSeriousness', e.target.value)}>
                    <option value="">Select</option>
                    <option value="serious">Serious</option>
                    <option value="non-serious">Non-Serious</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expectedness</label>
                  <select value={getValue('expectedness')} onChange={(e) => handleInputChange('expectedness', e.target.value)}>
                    <option value="">Select</option>
                    <option value="expected">Expected</option>
                    <option value="unexpected">Unexpected</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Risk Evaluation</label>
                  <textarea rows="4" value={getValue('riskEvaluation')} onChange={(e) => handleInputChange('riskEvaluation', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Medical Review</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Medical Reviewer Name</label>
                  <input type="text" value={getValue('medicalReviewerName')} onChange={(e) => handleInputChange('medicalReviewerName', e.target.value)} />
                </div>
                <div className="form-group full-width">
                  <label>Medical Comments</label>
                  <textarea rows="6" value={getValue('medicalComments')} onChange={(e) => handleInputChange('medicalComments', e.target.value)} />
                </div>
                <div className="form-group full-width">
                  <label>Assessment Conclusion</label>
                  <textarea rows="6" value={getValue('assessmentConclusion')} onChange={(e) => handleInputChange('assessmentConclusion', e.target.value)} />
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="tab-content">
            <h2>Activities Tab</h2>
            
            <section className="form-section">
              <h3>Case Workflow</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Case Creation Date</label>
                  <input type="datetime-local" value={getValue('caseCreationDate')} onChange={(e) => handleInputChange('caseCreationDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Last Updated Date</label>
                  <input type="datetime-local" value={getValue('lastUpdatedDate')} onChange={(e) => handleInputChange('lastUpdatedDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Current Owner</label>
                  <input type="text" value={getValue('currentOwner')} onChange={(e) => handleInputChange('currentOwner', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Assigned User</label>
                  <input type="text" value={getValue('assignedUser')} onChange={(e) => handleInputChange('assignedUser', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Case Lock Status</label>
                  <select value={getValue('caseLockStatus')} onChange={(e) => handleInputChange('caseLockStatus', e.target.value)}>
                    <option value="">Select Status</option>
                    <option value="locked">Locked</option>
                    <option value="unlocked">Unlocked</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Follow-ups</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Follow-up Required</label>
                  <select value={getValue('followupRequired')} onChange={(e) => handleInputChange('followupRequired', e.target.value)}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Follow-up Due Date</label>
                  <input type="date" value={getValue('followupDueDate')} onChange={(e) => handleInputChange('followupDueDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Follow-up Status</label>
                  <select value={getValue('followupStatus')} onChange={(e) => handleInputChange('followupStatus', e.target.value)}>
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Audit Trail</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Created By</label>
                  <input type="text" value={getValue('createdBy')} onChange={(e) => handleInputChange('createdBy', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Modified By</label>
                  <input type="text" value={getValue('modifiedBy')} onChange={(e) => handleInputChange('modifiedBy', e.target.value)} />
                </div>
                <div className="form-group full-width">
                  <label>Change History</label>
                  <textarea rows="6" value={getValue('changeHistory')} onChange={(e) => handleInputChange('changeHistory', e.target.value)} readOnly />
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'additional' && (
          <div className="tab-content">
            <h2>Additional Information Tab</h2>
            
            <section className="form-section">
              <h3>Narratives</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Case Narrative</label>
                  <textarea rows="8" value={getValue('caseNarrative')} onChange={(e) => handleInputChange('caseNarrative', e.target.value)} />
                </div>
                <div className="form-group full-width">
                  <label>Reporter Narrative</label>
                  <textarea rows="8" value={getValue('reporterNarrative')} onChange={(e) => handleInputChange('reporterNarrative', e.target.value)} />
                </div>
                <div className="form-group full-width">
                  <label>Company Narrative</label>
                  <textarea rows="8" value={getValue('companyNarrative')} onChange={(e) => handleInputChange('companyNarrative', e.target.value)} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Attachments</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Source Documents</label>
                  <input type="file" multiple onChange={(e) => handleInputChange('sourceDocuments', e.target.files)} />
                </div>
                <div className="form-group full-width">
                  <label>Medical Records</label>
                  <input type="file" multiple onChange={(e) => handleInputChange('medicalRecords', e.target.files)} />
                </div>
                <div className="form-group full-width">
                  <label>Lab Reports</label>
                  <input type="file" multiple onChange={(e) => handleInputChange('labReports', e.target.files)} />
                </div>
                <div className="form-group full-width">
                  <label>Discharge Summary</label>
                  <input type="file" onChange={(e) => handleInputChange('dischargeSummary', e.target.files)} />
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Comments</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Internal Comments</label>
                  <textarea rows="6" value={getValue('internalComments')} onChange={(e) => handleInputChange('internalComments', e.target.value)} />
                </div>
                <div className="form-group full-width">
                  <label>Regulatory Notes</label>
                  <textarea rows="6" value={getValue('regulatoryNotes')} onChange={(e) => handleInputChange('regulatoryNotes', e.target.value)} />
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'regulatory' && (
          <div className="tab-content">
            <h2>Regulatory Reports Tab</h2>
            
            <section className="form-section">
              <h3>Regulatory Submissions</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Authority</label>
                  <select value={getValue('authority')} onChange={(e) => handleInputChange('authority', e.target.value)}>
                    <option value="">Select Authority</option>
                    <option value="fda">FDA</option>
                    <option value="ema">EMA</option>
                    <option value="pmda">PMDA</option>
                    <option value="health-canada">Health Canada</option>
                    <option value="tga">TGA</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Report Type</label>
                  <select value={getValue('reportType')} onChange={(e) => handleInputChange('reportType', e.target.value)}>
                    <option value="">Select Type</option>
                    <option value="initial">Initial</option>
                    <option value="follow-up">Follow-up</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Submission Due Date</label>
                  <input type="date" value={getValue('submissionDueDate')} onChange={(e) => handleInputChange('submissionDueDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Submission Date</label>
                  <input type="date" value={getValue('submissionDate')} onChange={(e) => handleInputChange('submissionDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Submission Status</label>
                  <select value={getValue('submissionStatus')} onChange={(e) => handleInputChange('submissionStatus', e.target.value)}>
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="submitted">Submitted</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>Reporting Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>E2B Report Generated</label>
                  <select value={getValue('e2bReportGenerated')} onChange={(e) => handleInputChange('e2bReportGenerated', e.target.value)}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Gateway Status</label>
                  <select value={getValue('gatewayStatus')} onChange={(e) => handleInputChange('gatewayStatus', e.target.value)}>
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Acknowledgement Received</label>
                  <select value={getValue('acknowledgementReceived')} onChange={(e) => handleInputChange('acknowledgementReceived', e.target.value)}>
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="form-section">
              <h3>History</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Previous Submissions</label>
                  <textarea rows="6" value={getValue('previousSubmissions')} onChange={(e) => handleInputChange('previousSubmissions', e.target.value)} readOnly />
                </div>
                <div className="form-group full-width">
                  <label>Re-submission Records</label>
                  <textarea rows="6" value={getValue('resubmissionRecords')} onChange={(e) => handleInputChange('resubmissionRecords', e.target.value)} readOnly />
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Encode Modal */}
      {showEncodeModal && (
        <div className="modal-overlay" onClick={() => setShowEncodeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>MedDRA Coding Lookup</h3>
              <button className="modal-close" onClick={() => setShowEncodeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Search Term</label>
                <input 
                  type="text" 
                  value={encodeSearchTerm}
                  onChange={(e) => setEncodeSearchTerm(e.target.value)}
                  placeholder="Enter term to search in MedDRA"
                />
              </div>
              <div className="form-group">
                <label>Search Results</label>
                <div className="encode-results">
                  <div className="encode-result-item" onClick={() => {
                    if (encodeRowId) {
                      updateMedicalHistoryRow(encodeRowId, 'pt', 'Hypertension');
                      updateMedicalHistoryRow(encodeRowId, 'llt', 'Hypertension NOS');
                      setShowEncodeModal(false);
                    }
                  }}>
                    <div className="result-pt">PT: Hypertension</div>
                    <div className="result-llt">LLT: Hypertension NOS</div>
                  </div>
                  <div className="encode-result-item" onClick={() => {
                    if (encodeRowId) {
                      updateMedicalHistoryRow(encodeRowId, 'pt', 'Diabetes mellitus');
                      updateMedicalHistoryRow(encodeRowId, 'llt', 'Diabetes mellitus NOS');
                      setShowEncodeModal(false);
                    }
                  }}>
                    <div className="result-pt">PT: Diabetes mellitus</div>
                    <div className="result-llt">LLT: Diabetes mellitus NOS</div>
                  </div>
                  <p className="encode-note">Note: This is a simplified demo. In production, this would connect to a MedDRA API for real-time search.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEncodeModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseForm;
