/* eslint-disable react/no-unescaped-entities */
import React from 'react';

export default function Modal ({ setShowModal, handleConfirm, title, message, maxQuantity, cost  }) {
    const [quantity, setQuantity] = React.useState(1);

    const handleChange = (e) => {
        const value = Math.min(Math.max(1, parseInt(e.target.value || 0)), maxQuantity);
        setQuantity(value);
    };

    return (
     
        <div className="text-black fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
            <div className="bg-white p-4 rounded-lg shadow-xl">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <p>{message}</p>
                {maxQuantity && (
                    <>
                    <p className='my-2'>Vous pouvez vendre jusqu'à <b>{maxQuantity}</b> {maxQuantity > 1 ? "exemplaires" : "exemplaire"} (1 exemplaire = <b>{cost} OC</b>)</p>
                    <input
                    type="number"
                    value={quantity}
                    onChange={handleChange}
                    min={1}
                    max={maxQuantity}
                    className="border rounded p-2 text-center w-full mb-4"
                    />
                    </>
                )}
                <div className="flex justify-center mt-4">
                    {maxQuantity ? (
                        <button
                        onClick={() => handleConfirm(quantity)}
                        className="bg-green-500 text-white py-2 px-4 rounded mr-4"
                        >
                        Confirmer
                        </button>
                    ) : (
                        <button
                        onClick={handleConfirm}
                        className="bg-green-500 text-white py-2 px-4 rounded mr-4"
                        >
                        Confirmer
                        </button>
                    )}
                    <button
                        onClick={() => setShowModal(false)}
                        className="bg-red-500 text-white py-2 px-4 rounded"
                    >
                        Annuler
                    </button>
                </div>
            </div>
        </div>
 
    )
}