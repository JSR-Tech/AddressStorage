let db;

// Open or create the database
const request = indexedDB.open('DataCollectionDB', 1);

// Create the object store if it doesn't exist
request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains('entries')) {
        db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
    }
};

// Handle database opening success
request.onsuccess = function(event) {
    db = event.target.result;
    console.log('Database opened successfully');
    updateEntriesList(); // Load stored entries when the page loads
};

// Handle database errors
request.onerror = function(event) {
    console.error('Error opening database:', event.target.error);
};

// Add data to the database
document.getElementById('dataForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value || 'N/A';
    const address = document.getElementById('address').value;
    const phone = document.getElementById('phone').value || 'N/A';
    const email = document.getElementById('email').value || 'N/A';
    const emergencyContact1 = document.getElementById('emergencyContact1').value || 'N/A';
    const emergencyContact2 = document.getElementById('emergencyContact2').value || 'N/A';
    const dob = document.getElementById('dob').value || 'N/A';
    const idType = document.getElementById('idType').value || 'N/A';
    const idNumber = document.getElementById('idNumber').value || 'N/A';
    const idExpiry = document.getElementById('idExpiry').value || 'N/A';
    const result = document.getElementById('result').value;

    // Start a transaction
    const transaction = db.transaction(['entries'], 'readwrite');
    const objectStore = transaction.objectStore('entries');

    // Add the data to the object store
    const request = objectStore.add({
        name,
        address,
        phone,
        email,
        emergencyContact1,
        emergencyContact2,
        dob,
        idType,
        idNumber,
        idExpiry,
        result
    });

    request.onsuccess = function() {
        console.log('Entry added successfully');
        updateEntriesList(); // Refresh the displayed list
    };

    request.onerror = function(event) {
        console.error('Error adding entry:', event.target.error);
    };

    // Clear the form fields
    document.getElementById('dataForm').reset();
});

// Retrieve and display data from the database
function updateEntriesList(sortBy = null, filterBy = 'all') {
    const transaction = db.transaction(['entries'], 'readonly');
    const objectStore = transaction.objectStore('entries');
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        let entries = event.target.result;

        // Filter entries
        if (filterBy !== 'all') {
            entries = entries.filter(entry => entry.result === filterBy);
        }

        // Sort entries
        if (sortBy === 'even') {
            entries.sort((a, b) => {
                const aNumber = extractAddressNumber(a.address);
                const bNumber = extractAddressNumber(b.address);
                return (aNumber % 2 === 0 ? -1 : 1) - (bNumber % 2 === 0 ? -1 : 1);
            });
        } else if (sortBy === 'odd') {
            entries.sort((a, b) => {
                const aNumber = extractAddressNumber(a.address);
                const bNumber = extractAddressNumber(b.address);
                return (aNumber % 2 === 1 ? -1 : 1) - (bNumber % 2 === 1 ? -1 : 1);
            });
        }

        // Display entries
        const entriesList = document.getElementById('entriesList');
        entriesList.innerHTML = ''; // Clear the current list

        entries.forEach(entry => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'entry';

            entryDiv.innerHTML = `
                <p><strong>Name:</strong> ${entry.name}</p>
                <p><strong>Address:</strong> ${entry.address}</p>
                <p><strong>Phone:</strong> ${entry.phone}</p>
                <p><strong>Email:</strong> ${entry.email}</p>
                <p><strong>Emergency Contact 1:</strong> ${entry.emergencyContact1}</p>
                <p><strong>Emergency Contact 2:</strong> ${entry.emergencyContact2}</p>
                <p><strong>Date of Birth:</strong> ${entry.dob}</p>
                <p><strong>ID Type:</strong> ${entry.idType}</p>
                <p><strong>ID Number:</strong> ${entry.idNumber}</p>
                <p><strong>ID Expiry Date:</strong> ${entry.idExpiry}</p>
                <p><strong>Result:</strong> ${entry.result}</p>
                <button class="deleteButton" data-id="${entry.id}">Delete</button>
            `;

            entriesList.appendChild(entryDiv);
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.deleteButton').forEach(button => {
            button.addEventListener('click', deleteEntry);
        });
    };

    request.onerror = function(event) {
        console.error('Error retrieving entries:', event.target.error);
    };
}

// Extract the number from the address
function extractAddressNumber(address) {
    const numberMatch = address.match(/\d+/);
    return numberMatch ? parseInt(numberMatch[0], 10) : 0;
}

// Delete an entry
function deleteEntry(event) {
    const entryId = parseInt(event.target.getAttribute('data-id'), 10);

    const transaction = db.transaction(['entries'], 'readwrite');
    const objectStore = transaction.objectStore('entries');
    const request = objectStore.delete(entryId);

    request.onsuccess = function() {
        console.log('Entry deleted successfully');
        updateEntriesList(); // Refresh the displayed list
    };

    request.onerror = function(event) {
        console.error('Error deleting entry:', event.target.error);
    };
}

// Delete all entries
document.getElementById('deleteAll').addEventListener('click', function() {
    const transaction = db.transaction(['entries'], 'readwrite');
    const objectStore = transaction.objectStore('entries');
    const request = objectStore.clear();

    request.onsuccess = function() {
        console.log('All entries deleted successfully');
        updateEntriesList(); // Refresh the displayed list
    };

    request.onerror = function(event) {
        console.error('Error deleting all entries:', event.target.error);
    };
});

// Sorting and filtering event listeners
document.getElementById('sortEven').addEventListener('click', () => updateEntriesList('even'));
document.getElementById('sortOdd').addEventListener('click', () => updateEntriesList('odd'));
document.getElementById('filterResult').addEventListener('change', (event) => updateEntriesList(null, event.target.value));
