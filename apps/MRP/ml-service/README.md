# L-ERP MRP ML Service

Machine Learning microservice for L-ERP MRP System providing:
- Demand forecasting (Prophet, ARIMA, ETS, Ensemble)
- Lead time prediction (Gradient Boosting)
- Anomaly detection (Isolation Forest)
- Inventory optimization (Safety Stock, EOQ)

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
# Build
docker build -t rtr-ml-service .

# Run
docker run -p 8000:8000 rtr-ml-service
```

## API Endpoints

### Health
- `GET /health` - Health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Forecasting
- `POST /api/v1/forecast/demand` - Generate demand forecast
- `POST /api/v1/forecast/demand/batch` - Batch forecast
- `GET /api/v1/forecast/demand/{part_id}/history` - Forecast history

### Lead Time
- `POST /api/v1/leadtime/predict` - Predict lead time
- `GET /api/v1/leadtime/supplier/{supplier_id}/analysis` - Supplier analysis
- `POST /api/v1/leadtime/train/{supplier_id}` - Train model

### Anomaly Detection
- `POST /api/v1/anomaly/detect` - Detect anomalies
- `POST /api/v1/anomaly/detect/batch` - Batch detection

### Optimization
- `POST /api/v1/optimization/safety-stock` - Calculate safety stock
- `POST /api/v1/optimization/eoq` - Calculate EOQ
- `POST /api/v1/optimization/inventory-optimization` - Full optimization
- `POST /api/v1/optimization/batch-optimization` - Batch optimization

### Model Management
- `GET /api/v1/models/status` - Model status
- `GET /api/v1/models/{model_id}` - Model info
- `POST /api/v1/models/train` - Train model
- `DELETE /api/v1/models/{model_id}` - Delete model

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://rtr:password@db:5432/rtr_mrp |
| MODEL_DIR | Directory for saved models | /app/models |
| DEBUG | Enable debug mode | false |
| ALLOWED_ORIGINS | CORS allowed origins | http://localhost:3000 |

## Model Details

### Demand Forecasting
- **Prophet**: Facebook's time series forecasting
- **ARIMA**: Auto-regressive integrated moving average
- **ETS**: Exponential smoothing
- **Ensemble**: Weighted combination of all models

### Lead Time Prediction
- **Gradient Boosting**: XGBoost-style regression
- Features: order value, quantity, supplier history, time factors

### Anomaly Detection
- **Isolation Forest**: Unsupervised anomaly detection
- Configurable contamination rate

### Inventory Optimization
- **Safety Stock**: Standard, King's method, Dynamic
- **EOQ**: Economic Order Quantity with quantity discounts
- **Reorder Point**: Dynamic calculation with forecasts
