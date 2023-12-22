/* eslint-disable react/no-unescaped-entities */
export default function Modal ({ setShowModal, handleConfirm, title, message }) {
    return (
     
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center">
            <div className="bg-white p-4 rounded-lg shadow-xl">
                <h2 className="text-xl font-bold mb-4">{title}</h2>
                <p>{message}</p>
                <div className="flex justify-center mt-4">
                    <button
                        onClick={handleConfirm}
                        className="bg-green-500 text-white py-2 px-4 rounded mr-4"
                    >
                        Confirmer
                    </button>
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