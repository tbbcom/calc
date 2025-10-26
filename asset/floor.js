        // Global state
        let roomCount = 0;
        let currentUnit = 'imperial';
        const calculations = [];

        // Waste factors based on industry standards (NWFA, TCNA)
        const wasteFactors = {
            'tile-straight': 0.10,
            'tile-diagonal': 0.15,
            'tile-herringbone': 0.22,
            'hardwood-straight': 0.10,
            'hardwood-diagonal': 0.15,
            'laminate-straight': 0.08,
            'laminate-diagonal': 0.13,
            'vinyl-straight': 0.05,
            'vinyl-diagonal': 0.10,
            'carpet': 0.10
        };

        // Standard coverage rates for auxiliary materials
        const coverageRates = {
            underlayment: 100, // sq ft per roll
            adhesive: 50, // sq ft per gallon (average)
            grout: 150 // sq ft per 25lb bag (varies by joint size)
        };

        // Initialize with one room
        document.addEventListener('DOMContentLoaded', function() {
            addRoom();
            setupUnitToggle();
        });

        function setupUnitToggle() {
            const unitButtons = document.querySelectorAll('.unit-ibtn');
            unitButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    unitButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentUnit = this.dataset.unit;
                    updateUnitLabels();
                });
            });
        }

        function updateUnitLabels() {
            const lengthLabels = document.querySelectorAll('.length-label');
            const widthLabels = document.querySelectorAll('.width-label');
            
            lengthLabels.forEach(label => {
                label.textContent = currentUnit === 'imperial' ? 'Length (feet)' : 'Length (meters)';
            });
            widthLabels.forEach(label => {
                label.textContent = currentUnit === 'imperial' ? 'Width (feet)' : 'Width (meters)';
            });
        }

        function addRoom() {
            roomCount++;
            const container = document.getElementById('roomsContainer');
            
            const roomDiv = document.createElement('div');
            roomDiv.className = 'room-section';
            roomDiv.id = `room-${roomCount}`;
            roomDiv.dataset.roomId = roomCount;
            
            roomDiv.innerHTML = `
                <div class="room-header">
                    <h3>Room ${roomCount}</h3>
                    ${roomCount > 1 ? `<ibutton class="remove-room" onclick="removeRoom(${roomCount})">Remove</ibutton>` : ''}
                </div>
                
                <div class="input-group">
                    <label>Room Name (optional)</label>
                    <input type="text" id="roomName-${roomCount}" placeholder="e.g., Living Room, Kitchen">
                </div>

                <div class="input-row">
                    <div class="input-group">
                        <label class="length-label">${currentUnit === 'imperial' ? 'Length (feet)' : 'Length (meters)'}</label>
                        <input type="number" id="length-${roomCount}" step="0.1" min="0" placeholder="12.5" required>
                    </div>
                    <div class="input-group">
                        <label class="width-label">${currentUnit === 'imperial' ? 'Width (feet)' : 'Width (meters)'}</label>
                        <input type="number" id="width-${roomCount}" step="0.1" min="0" placeholder="10.0" required>
                    </div>
                </div>

                <div class="input-row">
                    <div class="input-group">
                        <label>Flooring Type</label>
                        <select id="floorType-${roomCount}">
                            <option value="tile">Tile</option>
                            <option value="hardwood">Hardwood</option>
                            <option value="laminate">Laminate</option>
                            <option value="vinyl">Vinyl/LVP</option>
                            <option value="carpet">Carpet</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>Installation Pattern</label>
                        <select id="pattern-${roomCount}">
                            <option value="straight">Straight/Standard</option>
                            <option value="diagonal">Diagonal (45°)</option>
                            <option value="herringbone">Herringbone/Chevron</option>
                        </select>
                    </div>
                </div>

                <div class="input-row">
                    <div class="input-group">
                        <label>Material Cost per ${currentUnit === 'imperial' ? 'sq ft' : 'sq m'} ($)</label>
                        <input type="number" id="cost-${roomCount}" step="0.01" min="0" placeholder="3.50">
                    </div>
                    <div class="input-group">
                        <label>Box/Package Coverage (${currentUnit === 'imperial' ? 'sq ft' : 'sq m'})</label>
                        <input type="number" id="boxSize-${roomCount}" step="0.01" min="0" placeholder="23.91">
                    </div>
                </div>
            `;
            
            container.appendChild(roomDiv);
        }

        function removeRoom(roomId) {
            const room = document.getElementById(`room-${roomId}`);
            if (room) {
                room.remove();
            }
        }

        function calculateFlooring() {
            const rooms = document.querySelectorAll('.room-section');
            if (rooms.length === 0) {
                alert('Please add at least one room to calculate.');
                return;
            }

            calculations.length = 0;
            let totalArea = 0;
            let totalWithWaste = 0;
            let totalCost = 0;
            let hasErrors = false;

            rooms.forEach(room => {
                const roomId = room.dataset.roomId;
                const roomName = document.getElementById(`roomName-${roomId}`).value || `Room ${roomId}`;
                const length = parseFloat(document.getElementById(`length-${roomId}`).value);
                const width = parseFloat(document.getElementById(`width-${roomId}`).value);
                const floorType = document.getElementById(`floorType-${roomId}`).value;
                const pattern = document.getElementById(`pattern-${roomId}`).value;
                const costPerUnit = parseFloat(document.getElementById(`cost-${roomId}`).value) || 0;
                const boxSize = parseFloat(document.getElementById(`boxSize-${roomId}`).value) || 0;

                if (!length || !width || length <= 0 || width <= 0) {
                    hasErrors = true;
                    return;
                }

                const area = length * width;
                const wasteKey = `${floorType}-${pattern}`;
                const wasteFactor = wasteFactors[wasteKey] || 0.10;
                const areaWithWaste = area * (1 + wasteFactor);
                const cost = areaWithWaste * costPerUnit;
                const boxesNeeded = boxSize > 0 ? Math.ceil(areaWithWaste / boxSize) : 0;
                const actualCoverage = boxesNeeded * boxSize;

                calculations.push({
                    roomName,
                    length,
                    width,
                    area,
                    wasteFactor,
                    areaWithWaste,
                    floorType,
                    pattern,
                    costPerUnit,
                    cost,
                    boxSize,
                    boxesNeeded,
                    actualCoverage
                });

                totalArea += area;
                totalWithWaste += areaWithWaste;
                totalCost += cost;
            });

            if (hasErrors) {
                alert('Please fill in length and width for all rooms with valid positive numbers.');
                return;
            }

            displayResults();
        }

        function displayResults() {
            const resultsSection = document.getElementById('resultsSection');
            const resultsContent = document.getElementById('resultsContent');
            
            let html = '';

            // Individual room results
            calculations.forEach((calc, index) => {
                const unitLabel = currentUnit === 'imperial' ? 'sq ft' : 'sq m';
                const lengthUnit = currentUnit === 'imperial' ? 'ft' : 'm';
                
                html += `
                    <div class="result-card">
                        <h3>${calc.roomName}</h3>
                        <div class="result-row">
                            <span class="result-label">Dimensions:</span>
                            <span class="result-value">${calc.length.toFixed(1)} × ${calc.width.toFixed(1)} ${lengthUnit}</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Floor Area:</span>
                            <span class="result-value">${calc.area.toFixed(2)} ${unitLabel}</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Flooring Type:</span>
                            <span class="result-value">${capitalize(calc.floorType)} - ${capitalize(calc.pattern)}</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Waste Factor:</span>
                            <span class="result-value">${(calc.wasteFactor * 100).toFixed(0)}%</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">Material Needed (with waste):</span>
                            <span class="result-value highlight">${calc.areaWithWaste.toFixed(2)} ${unitLabel}</span>
                        </div>
                        ${calc.boxesNeeded > 0 ? `
                        <div class="result-row">
                            <span class="result-label">Boxes/Packages Needed:</span>
                            <span class="result-value highlight">${calc.boxesNeeded} boxes (${calc.actualCoverage.toFixed(2)} ${unitLabel} total)</span>
                        </div>
                        ` : ''}
                        ${calc.cost > 0 ? `
                        <div class="result-row">
                            <span class="result-label">Estimated Material Cost:</span>
                            <span class="result-value highlight">$${calc.cost.toFixed(2)}</span>
                        </div>
                        ` : ''}
                    </div>
                `;
            });

            // Project totals
            const totalArea = calculations.reduce((sum, calc) => sum + calc.area, 0);
            const totalWithWaste = calculations.reduce((sum, calc) => sum + calc.areaWithWaste, 0);
            const totalCost = calculations.reduce((sum, calc) => sum + calc.cost, 0);
            const totalBoxes = calculations.reduce((sum, calc) => sum + calc.boxesNeeded, 0);
            const unitLabel = currentUnit === 'imperial' ? 'sq ft' : 'sq m';

            html += `
                <div class="result-card" style="border: 2px solid #489c49;">
                    <h3>🎯 Project Totals</h3>
                    <div class="result-row">
                        <span class="result-label">Total Floor Area:</span>
                        <span class="result-value highlight">${totalArea.toFixed(2)} ${unitLabel}</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">Total Material with Waste:</span>
                        <span class="result-value highlight">${totalWithWaste.toFixed(2)} ${unitLabel}</span>
                    </div>
                    ${totalBoxes > 0 ? `
                    <div class="result-row">
                        <span class="result-label">Total Boxes Needed:</span>
                        <span class="result-value highlight">${totalBoxes} boxes</span>
                    </div>
                    ` : ''}
                    ${totalCost > 0 ? `
                    <div class="result-row">
                        <span class="result-label">Total Material Cost:</span>
                        <span class="result-value highlight">$${totalCost.toFixed(2)}</span>
                    </div>
                    ` : ''}
                </div>
            `;

            // Auxiliary materials
            html += generateAuxiliaryMaterials(totalWithWaste, unitLabel);

            // Info box
            html += `
                <div class="info-box">
                    <p><strong>💡 Pro Tips:</strong></p>
                    <p>✓ Waste factors are based on NWFA and TCNA industry standards</p>
                    <p>✓ Purchase boxes rounded up to ensure complete coverage</p>
                    <p>✓ Order extra material for future repairs and replacements</p>
                    <p>✓ Herringbone and diagonal patterns require higher waste factors due to increased cuts</p>
                </div>
            `;

            // Disclaimer
            html += `
                <div class="disclaimer">
                    <p><strong>⚠️ Disclaimer:</strong> This calculator provides estimates based on industry standard waste factors. Actual material needs may vary depending on room complexity, material defects, installer experience, and specific product requirements. Always consult with a professional installer and purchase extra material for irregularly shaped rooms, pattern matching, or future repairs. Verify all measurements before ordering materials.</p>
                </div>
            `;

            resultsContent.innerHTML = html;
            resultsSection.classList.add('show');
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        function generateAuxiliaryMaterials(totalArea, unitLabel) {
            const underlaymentRolls = Math.ceil(totalArea / coverageRates.underlayment);
            const adhesiveGallons = Math.ceil(totalArea / coverageRates.adhesive);
            const groutBags = Math.ceil(totalArea / coverageRates.grout);

            // Check if any room uses tile or hardwood
            const needsAdhesive = calculations.some(c => c.floorType === 'tile' || c.floorType === 'hardwood');
            const needsGrout = calculations.some(c => c.floorType === 'tile');
            const needsUnderlayment = calculations.some(c => c.floorType === 'laminate' || c.floorType === 'vinyl');

            if (!needsAdhesive && !needsGrout && !needsUnderlayment) {
                return '';
            }

            let html = `
                <div class="result-card">
                    <h3>🛠️ Additional Materials Needed</h3>
            `;

            if (needsUnderlayment) {
                html += `
                    <div class="result-row">
                        <span class="result-label">Underlayment Rolls (100 ${unitLabel}/roll):</span>
                        <span class="result-value">${underlaymentRolls} rolls</span>
                    </div>
                `;
            }

            if (needsAdhesive) {
                html += `
                    <div class="result-row">
                        <span class="result-label">Adhesive/Thinset (50 ${unitLabel}/gal):</span>
                        <span class="result-value">${adhesiveGallons} gallons</span>
                    </div>
                `;
            }

            if (needsGrout) {
                html += `
                    <div class="result-row">
                        <span class="result-label">Grout (150 ${unitLabel}/25lb bag):</span>
                        <span class="result-value">${groutBags} bags</span>
                    </div>
                `;
            }

            html += `
                    <div class="info-box" style="margin-top: 15px;">
                        <p><strong>Note:</strong> Auxiliary material estimates are approximate. Coverage rates vary by product and application method. Consult manufacturer specifications for accurate quantities.</p>
                    </div>
                </div>
            `;

            return html;
        }

        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        function printResults() {
            window.print();
        }

        function shareResults() {
            const totalArea = calculations.reduce((sum, calc) => sum + calc.area, 0);
            const totalWithWaste = calculations.reduce((sum, calc) => sum + calc.areaWithWaste, 0);
            const unitLabel = currentUnit === 'imperial' ? 'sq ft' : 'sq m';
            
            const shareText = `Flooring Project Estimate:\n\nTotal Area: ${totalArea.toFixed(2)} ${unitLabel}\nMaterial Needed: ${totalWithWaste.toFixed(2)} ${unitLabel}\n\nCalculate yours at: ${window.location.href}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Flooring Calculator Results',
                    text: shareText
                }).catch(err => console.log('Share cancelled'));
            } else {
                navigator.clipboard.writeText(shareText).then(() => {
                    alert('Results copied to clipboard!');
                });
            }
        }

        function resetCalculator() {
            if (confirm('This will clear all rooms and start a new project. Continue?')) {
                document.getElementById('roomsContainer').innerHTML = '';
                document.getElementById('resultsSection').classList.remove('show');
                roomCount = 0;
                calculations.length = 0;
                addRoom();
            }
        }
