  // Exportera insamlad data till fil
  const handleExportData = () => {
    const dataToExport = collectedData.length > 0 ? collectedData : HistoricalDataCollector.loadFromStorage('collected_training_data');
    if (dataToExport && dataToExport.length > 0) {
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `collectedData_${selectedSport}_${dateStr}.json`;
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Ingen data att exportera!');
    }
  };

import React, { useState } from 'react';
import { HistoricalDataCollector, type CollectionProgress } from '../calculations/ml/historicalDataCollector';
import { HorseRacingEnsemble } from '../calculations/ml/ensemble';
// import { FeatureEngineer } from '../calculations/ml/featureEngineering';

const DataCollectionPanel: React.FC = () => {
  // State
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({ startDate: '', endDate: '' });
  const [selectedSport, setSelectedSport] = useState<'gallop' | 'trav'>('gallop');
  const [isCollecting, setIsCollecting] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [collectedData, setCollectedData] = useState<any[]>([]);
  const [progress, setProgress] = useState<CollectionProgress | null>(null);
  const [mlWeights, setMLWeights] = useState<any>(null);

  // Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(files);
      // Läs in och kombinera JSON-data
      const allData: any[] = [];
      for (const file of files) {
        try {
          const text = await file.text();
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            allData.push(...json);
          } else if (json) {
            allData.push(json);
          }
        } catch (err) {
          console.error('Fel vid uppladdning av fil:', file.name, err);
        }
      }
      if (allData.length > 0) {
        setCollectedData(allData);
      }
    }
  };

  const handleCollectData = async () => {
    setIsCollecting(true);
    setProgress(null);
    try {
      const { startDate, endDate } = dateRange;
      if (!startDate || !endDate) {
        alert('Välj både start- och slutdatum.');
        setIsCollecting(false);
        return;
      }
      const collector = new HistoricalDataCollector();
      const data = await collector.collectHistoricalData(
        { startDate, endDate },
        undefined,
        [selectedSport],
        (p: CollectionProgress) => setProgress({ ...p })
      );
      setCollectedData(data);
      alert('Insamling klar!');
    } catch (error) {
      console.error('Collection failed:', error);
      alert('Insamling misslyckades. Se konsolen för detaljer.');
    } finally {
      setIsCollecting(false);
    }
  };

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      // 1. Hämta träningsdata (alltid från collectedData, som nu även sätts vid filuppladdning)
      const data = collectedData;
      if (!data || data.length === 0) {
        alert('Ingen träningsdata tillgänglig.');
        setIsTraining(false);
        return;
      }

      // 2. Extrahera features och target
      const trainingData: any[] = [];
      for (const race of data) {
        if (!race.horses) continue;
        for (const horse of race.horses) {
          let features: number[] = [];
          if (race.sport === 'trav') {
            // Trav: 11 features, ingen weightAdjustedRatingPoints
            features = [
              (horse.headToHeadPoints ?? 0) / 100,
              (horse.bettingPercentagePoints ?? 0) / 100,
              (horse.trainerPoints ?? 0) / 100,
              (horse.driverPoints ?? 0) / 100,
              (horse.equipmentPoints ?? 0) / 100,
              (horse.formPoints ?? 0) / 100,
              (horse.earningsPerStartCurrentYearPoints ?? 0) / 100,
              (horse.earningsPerStartLastTwoYearsPoints ?? 0) / 100,
              (horse.timePerformancePoints ?? 0) / 100,
              (horse.startPositionPoints ?? 0) / 100,
              (horse.classPoints ?? 0) / 100
            ];
          } else {
            // Galopp: 9 features, med weightAdjustedRatingPoints
            features = [
              (horse.headToHeadPoints ?? 0) / 100,
              (horse.bettingPercentagePoints ?? 0) / 100,
              (horse.trainerPoints ?? 0) / 100,
              (horse.driverPoints ?? 0) / 100,
              (horse.weightAdjustedRatingPoints ?? 0) / 100,
              (horse.equipmentPoints ?? 0) / 100,
              (horse.formPoints ?? 0) / 100,
              (horse.earningsPerStartCurrentYearPoints ?? 0) / 100,
              (horse.earningsPerStartLastTwoYearsPoints ?? 0) / 100
            ];
          }
          trainingData.push({
            features,
            target: horse.place === 1 ? 1 : 0,
            raceId: race.raceId || race.id,
            horseId: horse.startNumber
          });
        }
      }
      // Logga ut features och target för första 5 träningsraderna
      console.log('Exempel på träningsdata:', trainingData.slice(0, 5));

      if (trainingData.length === 0) {
        alert('Ingen träningsdata kunde extraheras.');
        setIsTraining(false);
        return;
      }

      // 3. Träna ensemble-modell
      const ensemble = new HorseRacingEnsemble();
      ensemble.train(trainingData);
      const weights = ensemble.getFeatureWeights();
      setMLWeights(weights);
      // Kontrollera om alla vikter är noll
      const allZero = Object.values(weights).every((v) => v === 0);
      if (allZero) {
        alert('ML-träning klar, men alla vikter är noll! Kontrollera träningsdata och poängfält.');
      } else {
        alert('ML-träning klar!');
      }
    } catch (error) {
      console.error('Training failed:', error);
      alert('ML-träning misslyckades. Se konsolen för detaljer.');
    } finally {
      setIsTraining(false);
    }
  };

  const handleExportMLConfig = () => {
    if (!mlWeights) {
      alert('Ingen ML-viktning att exportera. Träna modellen först.');
      return;
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    const sport = selectedSport;
    let fileName = '';
    let exportObj: any = {};
    if (sport === 'gallop') {
      fileName = `pointsMLConfig_galopp_${dateStr}.ts`;
      exportObj = { ...mlWeights };
    } else {
      fileName = `pointsMLConfig_trav_${dateStr}.ts`;
      // Endast trav-relevanta features
      const {
        headToHeadPoints,
        bettingPercentagePoints,
        trainerPoints,
        driverPoints,
        equipmentPoints,
        formPoints,
        earningsPerStartCurrentYearPoints,
        earningsPerStartLastTwoYearsPoints,
        timePerformancePoints,
        startPositionPoints,
        classPoints,
        bias
      } = mlWeights;
      exportObj = {
        headToHeadPoints,
        bettingPercentagePoints,
        trainerPoints,
        driverPoints,
        equipmentPoints,
        formPoints,
        earningsPerStartCurrentYearPoints,
        earningsPerStartLastTwoYearsPoints,
        timePerformancePoints,
        startPositionPoints,
        classPoints,
        bias
      };
    }
    const exportString = `export const ML_CATEGORY_WEIGHTS = ${JSON.stringify(exportObj, null, 2)};\n`;
    const blob = new Blob([exportString], { type: 'text/typescript' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportera insamlad data till fil
  const handleExportData = () => {
    const dataToExport = collectedData.length > 0 ? collectedData : HistoricalDataCollector.loadFromStorage('collected_training_data');
    if (dataToExport && dataToExport.length > 0) {
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `collectedData_${selectedSport}_${dateStr}.json`;
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Ingen data att exportera!');
    }
  };

  // Main render
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Visa ML_CATEGORY_WEIGHTS direkt efter träning */}
      {mlWeights && (
        <div className="mb-6 bg-gray-100 border rounded p-3">
          <h3 className="font-semibold mb-2 text-sm text-gray-700">ML_CATEGORY_WEIGHTS:</h3>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{`export const ML_CATEGORY_WEIGHTS = ${JSON.stringify(mlWeights, null, 2)};`}</pre>
          {Object.values(mlWeights).every((v) => v === 0) && (
            <div className="text-red-600 text-xs mt-2">⚠️ Alla vikter är noll! Kontrollera träningsdata och poängfält.</div>
          )}
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🧠 ML Training Data Collection</h2>

      {/* STEG 1: Välj period, sport, samla & exportera data, status */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2 text-blue-900">1. Välj period och sport, samla & exportera data</h3>
        <div className="flex gap-4 items-end mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isCollecting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isCollecting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sport</label>
            <select
              value={selectedSport}
              onChange={e => setSelectedSport(e.target.value as 'gallop' | 'trav')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isCollecting}
            >
              <option value="gallop">Galopp</option>
              <option value="trav">Trav</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={handleCollectData}
            disabled={isCollecting || isTraining}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCollecting ? 'Collecting...' : 'Collect Historical Data'}
          </button>
          <button
            onClick={handleExportData}
            disabled={isCollecting || isTraining}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Data
          </button>
        </div>
        {/* Insamlingsstatus */}
        {progress && (
          <div className="mb-6">
            <h4 className="text-md font-semibold mb-2">Insamlingsstatus</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Days: {progress.processedDays} / {progress.totalDays}</span>
                <span>{Math.round((progress.processedDays / progress.totalDays) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(progress.processedDays / progress.totalDays) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Races: {progress.processedRaces} / {progress.totalRaces}</span>
                <span>{progress.totalRaces > 0 ? Math.round((progress.processedRaces / progress.totalRaces) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress.totalRaces > 0 ? (progress.processedRaces / progress.totalRaces) * 100 : 0}%` }}
                ></div>
              </div>
              {progress.errors && progress.errors.length > 0 && (
                <div className="text-red-600 text-sm">
                  Errors: {progress.errors.length}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Data summary after step 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600">{collectedData.length}</div>
            <div className="text-sm text-gray-600">Total Races</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold text-green-600">
              {collectedData.reduce((sum, race) => sum + (race.horses ? race.horses.length : 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Horses</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {collectedData.filter(race => race.sport === 'gallop').length}
            </div>
            <div className="text-sm text-gray-600">Gallop Races</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold text-orange-600">
              {collectedData.filter(race => race.sport === 'trav').length}
            </div>
            <div className="text-sm text-gray-600">Trav Races</div>
          </div>
        </div>
      </div>
      <hr className="my-6" />

      {/* STEG 2: Ladda upp träningsdata & träna ML-modell */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2 text-blue-900">2. Ladda upp träningsdata & träna ML-modell</h3>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ladda upp historiska datafiler (JSON, flera tillåtna):</label>
        <div>
          <input
            type="file"
            accept="application/json"
            multiple
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isCollecting || isTraining}
          />
          <div className="text-xs text-gray-500 mt-1">
            {uploadedFiles.length > 0
              ? `${uploadedFiles.length} fil(er) valda`
              : 'Inga filer valda'}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={handleTrainModel}
            disabled={isCollecting || isTraining}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTraining ? 'Training...' : 'Train ML Model'}
          </button>
        </div>
        {/* Data summary after step 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold text-blue-600">{collectedData.length}</div>
            <div className="text-sm text-gray-600">Total Races</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold text-green-600">
              {collectedData.reduce((sum, race) => sum + (race.horses ? race.horses.length : 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Horses</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {collectedData.filter(race => race.sport === 'gallop').length}
            </div>
            <div className="text-sm text-gray-600">Gallop Races</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold text-orange-600">
              {collectedData.filter(race => race.sport === 'trav').length}
            </div>
            <div className="text-sm text-gray-600">Trav Races</div>
          </div>
        </div>
      </div>
      <hr className="my-6" />

      {/* STEG 3: Exportera ML Config */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2 text-blue-900">3. Exportera ML Config</h3>
        <div className="flex flex-wrap gap-3 mb-2">
          <button
            onClick={handleExportMLConfig}
            disabled={isCollecting || isTraining}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📁 Export ML Config
          </button>
        </div>
      </div>
      <hr className="my-6" />



      {/* SECTION 6: Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">6. Instruktioner</h3>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
          <li>Välj ett datumintervall (3-6 månader rekommenderas för bra träningsdata)</li>
          <li>Klicka på "Collect Historical Data" för att samla in resultat</li>
          <li>Vänta tills insamlingen är klar (kan ta flera minuter)</li>
          <li>Klicka på "Train ML Model" för att träna din förbättrade rankningsalgoritm</li>
          <li>Klicka på "📁 Export ML Config" för att ladda ner den uppdaterade pointsMLConfig.ts-filen</li>
          <li>Byt ut den befintliga pointsMLConfig.ts-filen mot den nedladdade versionen</li>
          <li>De nya ML-vikterna används som fallback när den tränade modellen inte är tillgänglig</li>
        </ol>
        <div className="mt-2 text-xs text-blue-600">
          💡 Tips: Börja med "Quick Collection" för att testa med färsk data, gör sedan en större insamling för bättre resultat.
        </div>
      </div>
    </div>
  );
};

export default DataCollectionPanel;
