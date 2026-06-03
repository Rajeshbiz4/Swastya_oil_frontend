import React, { useState } from 'react';
import { InvoiceProduct } from '../types/invoice.types';
import { invoiceService } from '../services/invoice.service';

interface InvoiceFormProps {
    oilTypes: string[];
    packagingTypes: string[];
    finishedGoods: Array<{
        oilType: string;
        packagingType: string;
        quantity: number;
        isActive?: boolean;
    }>;
    onClose: () => void;
    onCreated: () => void;
    setPopup: React.Dispatch<
        React.SetStateAction<{
            isOpen: boolean;
            type: 'success' | 'error' | 'warning' | 'info';
            title?: string;
            message: string;
        }>
    >;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

const generateInvoiceNumber = () => {
    return `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({
    oilTypes,
    packagingTypes,
    finishedGoods,
    onClose,
    onCreated,
    setPopup,
}) => {
    const [invoiceNumber] = useState(generateInvoiceNumber());
    const [date, setDate] = useState(getTodayDate());
    const [customerName, setCustomerName] = useState('');
    const [contact, setContact] = useState('');
    const [address, setAddress] = useState('');
    const [gstNo, setGstNo] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    const [productRateCache, setProductRateCache] = useState<
        Record<
            string,
            {
                finalRate: number;
                availableQuantity: number;
                oilAverageRate: number;
                packagingRatePerUnit: number;
                liters: number;
            }
        >
    >({});
    const [products, setProducts] = useState<InvoiceProduct[]>([
        {
            oilType: '',
            type: '',
            rate: 0,
            qty: 0,
            total: 0,
        },
    ]);

    const extractLitersFromPackagingType = (packagingType: string): number => {
        const match = packagingType.match(
            /(\d+(\.\d+)?)\s*(l|ltr|ltrs|liter|litre|liters|litres)/i
        );

        if (!match) {
            return 1;
        }

        return Number(match[1]);
    };

    const getApiErrorMessage = (err: any): string => {
        return (
            err?.error?.message ||
            err?.message ||
            'Something went wrong while calculating invoice rate.'
        );
    };

    const fetchInvoiceProductRate = async (
        oilType: string,
        packagingType: string
    ): Promise<{
        finalRate: number;
        availableQuantity: number;
    }> => {
        if (!oilType || !packagingType) {
            return {
                finalRate: 0,
                availableQuantity: 0,
            };
        }

        const cacheKey = `${oilType}-${packagingType}`;

        if (productRateCache[cacheKey] !== undefined) {
            return {
                finalRate: productRateCache[cacheKey].finalRate,
                availableQuantity: productRateCache[cacheKey].availableQuantity,
            };
        }

        try {
            const liters = extractLitersFromPackagingType(packagingType);

            let rawOilData;
            let finishedGoodsData;
            let packagingData;

            try {
                debugger;
                //rawOilData = await invoiceService.getRawOilAverageRate(oilType);
                rawOilData = await invoiceService.getOilAverageRate(oilType);
            } catch (err: any) {
                throw new Error(`Raw Oil Inventory Error: ${getApiErrorMessage(err)}`);
            }

            try {
                finishedGoodsData = await invoiceService.getFinishedGoodsQuantity(
                    oilType,
                    packagingType
                );
            } catch (err: any) {
                throw new Error(
                    `Finished Goods Inventory Error: ${getApiErrorMessage(err)}`
                );
            }

            try {
                packagingData = await invoiceService.getPackagingRate(packagingType);
            } catch (err: any) {
                throw new Error(
                    `Packaging Inventory Error: ${getApiErrorMessage(err)}`
                );
            }

            const oilAverageRate = Number(rawOilData.averageRate || 0);
            const packagingRatePerUnit = Number(packagingData.ratePerUnit || 0);
            const availableQuantity = Number(
                finishedGoodsData.availableQuantity || 0
            );

            const oilAmount = oilAverageRate * liters;
            const finalRate = oilAmount + packagingRatePerUnit;

            setProductRateCache((prev) => ({
                ...prev,
                [cacheKey]: {
                    finalRate,
                    availableQuantity,
                    oilAverageRate,
                    packagingRatePerUnit,
                    liters,
                },
            }));

            return {
                finalRate,
                availableQuantity,
            };
        } catch (err: any) {
            console.error('Error calculating invoice product rate:', err);

            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Rate Calculation Error',
                message: err.message || 'Failed to calculate rate.',
            });

            return {
                finalRate: 0,
                availableQuantity: 0,
            };
        }
    };

    const getPackagingTypesByOilType = (oilType: string) => {
        if (!oilType) {
            return packagingTypes;
        }

        return Array.from(
            new Set(
                finishedGoods
                    .filter(
                        (item) =>
                            item.oilType === oilType &&
                            item.isActive !== false &&
                            Number(item.quantity) > 0
                    )
                    .map((item) => item.packagingType)
                    .filter(Boolean)
            )
        ).sort();
    };

    const handleProductChange = async (
        index: number,
        field: keyof InvoiceProduct,
        value: string
    ) => {
        debugger;
        const updatedProducts = [...products];
        const currentProduct = { ...updatedProducts[index] };

        if (field === 'oilType') {
            currentProduct.oilType = value;
            currentProduct.type = '';
            currentProduct.rate = 0;
            currentProduct.total = 0;
        }

        if (field === 'type') {
            currentProduct.type = value;
        }

        if (field === 'qty') {
            currentProduct.qty = Number(value) || 0;
        }

        if (field === 'rate') {
            currentProduct.rate = Number(value) || 0;
        }

        if (
            (field === 'oilType' || field === 'type') &&
            currentProduct.oilType &&
            currentProduct.type
        ) {
            const rateResult = await fetchInvoiceProductRate(
                currentProduct.oilType,
                currentProduct.type
            );

            currentProduct.rate = rateResult.finalRate;
        }

        if (
            field === 'qty' &&
            currentProduct.oilType &&
            currentProduct.type &&
            Number(currentProduct.qty) > 0
        ) {
            const rateResult = await fetchInvoiceProductRate(
                currentProduct.oilType,
                currentProduct.type
            );

            if (
                rateResult.availableQuantity > 0 &&
                Number(currentProduct.qty) > rateResult.availableQuantity
            ) {
                setPopup({
                    isOpen: true,
                    type: 'warning',
                    title: 'Stock Not Available',
                    message: `Only ${rateResult.availableQuantity} quantity available for ${currentProduct.oilType} - ${currentProduct.type}.`,
                });

                currentProduct.qty = rateResult.availableQuantity;
            }

            currentProduct.rate = rateResult.finalRate;
        }

        currentProduct.total =
            Number(currentProduct.rate || 0) * Number(currentProduct.qty || 0);

        currentProduct.total =
            Number(currentProduct.rate || 0) * Number(currentProduct.qty || 0);

        updatedProducts[index] = currentProduct;
        setProducts(updatedProducts);
    };

    const addRow = () => {
        setProducts([
            ...products,
            {
                oilType: '',
                type: '',
                rate: 0,
                qty: 0,
                total: 0,
            },
        ]);
    };

    const removeRow = (index: number) => {
        if (products.length === 1) return;

        setProducts(products.filter((_, i) => i !== index));
    };

    const grandTotal = products.reduce((sum, product) => {
        return sum + Number(product.total || 0);
    }, 0);

    const handleSave = async () => {
        try {
            if (!customerName || !contact || !address) {
                setPopup({
                    isOpen: true,
                    type: 'warning',
                    title: 'Validation Error',
                    message: 'Customer name, contact and address are required.',
                });
                return;
            }

            const validProducts = products.filter(
                (p) => p.oilType && p.type && Number(p.qty) > 0
            );

            if (validProducts.length === 0) {
                setPopup({
                    isOpen: true,
                    type: 'warning',
                    title: 'Validation Error',
                    message: 'Please add at least one valid product.',
                });
                return;
            }

            setSaving(true);

            await invoiceService.createInvoice({
                invoiceNumber,
                date,
                customerName,
                contact,
                address,
                gstNo,
                note,
                status: 'pending',
                createdBy: 'admin',
                products: validProducts.map((p) => ({
                    oilType: p.oilType,
                    type: p.type,
                    rate: Number(p.rate),
                    qty: Number(p.qty),
                    total: Number(p.rate) * Number(p.qty),
                })),
            });

            setPopup({
                isOpen: true,
                type: 'success',
                title: 'Invoice Created',
                message: 'Invoice created successfully.',
            });

            onCreated();
            onClose();
        } catch (err: any) {
            console.error('Create invoice error:', err);

            setPopup({
                isOpen: true,
                type: 'error',
                title: 'Invoice Error',
                message: err.message || 'Failed to create invoice.',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal" role="dialog" aria-modal="true">
            <div className="modal-content invoice-form-modal">
                <div className="modal-header">
                    <h3>Create Invoice</h3>

                    <button className="modal-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="invoice-form-row">
                    <input className="invoice-input" value={invoiceNumber} readOnly />

                    <input
                        className="invoice-input"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div className="invoice-form-row">
                    <input
                        className="invoice-input"
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />

                    <input
                        className="invoice-input"
                        placeholder="Contact"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                    />
                </div>

                <div className="invoice-form-row">
                    <input
                        className="invoice-input"
                        placeholder="Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />

                    <input
                        className="invoice-input"
                        placeholder="GST No"
                        value={gstNo}
                        onChange={(e) => setGstNo(e.target.value)}
                    />
                </div>

                <h4>Product Details</h4>

                <table className="invoice-product-table">
                    <thead>
                        <tr>
                            <th>Oil Type</th>
                            <th>Packaging Type</th>
                            <th>Rate</th>
                            <th>Qty</th>
                            <th>Total</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {products.map((product, index) => (
                            <tr key={index}>
                                <td>
                                    <select
                                        className="invoice-input"
                                        value={product.oilType}
                                        onChange={(e) =>
                                            handleProductChange(index, 'oilType', e.target.value)
                                        }
                                    >
                                        <option value="">Select Oil Type</option>

                                        {oilTypes.map((oilType) => (
                                            <option key={oilType} value={oilType}>
                                                {oilType}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <select
                                        className="invoice-input"
                                        value={product.type}
                                        onChange={(e) =>
                                            handleProductChange(index, 'type', e.target.value)
                                        }
                                    >
                                        <option value="">Select Packaging Type</option>

                                        {packagingTypes.map((packagingType) => (
                                            <option key={packagingType} value={packagingType}>
                                                {packagingType}
                                            </option>
                                        ))}
                                    </select>
                                </td>

                                <td>
                                    <input
                                        className="invoice-input"
                                        type="number"
                                        value={product.rate}
                                        onChange={(e) =>
                                            handleProductChange(index, 'rate', e.target.value)
                                        }
                                    />
                                </td>

                                <td>
                                    <input
                                        className="invoice-input"
                                        type="number"
                                        value={product.qty}
                                        onChange={(e) =>
                                            handleProductChange(index, 'qty', e.target.value)
                                        }
                                    />
                                </td>

                                <td>₹{Number(product.total || 0).toFixed(2)}</td>

                                <td>
                                    <button
                                        type="button"
                                        className="danger-button"
                                        onClick={() => removeRow(index)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button type="button" className="primary-button" onClick={addRow}>
                    Add Row
                </button>

                <h4>Grand Total: ₹ {grandTotal.toFixed(2)}</h4>

                <textarea
                    className="invoice-input"
                    rows={3}
                    placeholder="Add Note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{ width: '100%' }}
                />

                <div className="modal-actions">
                    <button
                        type="button"
                        className="primary-button"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;