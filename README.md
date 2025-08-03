# V2.Kleats - Food Ordering App

## API Configuration

To connect to your API, create a `.env.local` file in the root directory with the following content:

```env
# Replace with your actual API base URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Recent Changes

### Updated Categories API Integration

The homepage now integrates with your API endpoint for food categories:

- **API Endpoint**: `{{baseUrl}}/api/canteen/item/categories`
- **Response Format**: 
  ```json
  {
    "code": 1,
    "data": [
      {
        "name": "Starters",
        "startTime": "",
        "endTime": "",
        "no_of_items": 0,
        "avalbleDays": [2, 3, 4, 5, 6, 7],
        "isAvalable": true,
        "poster": "/images/categories/1.jpeg"
      }
    ]
  }
  ```

### Updated Canteens API Integration

The homepage now integrates with your API endpoint for canteens:

- **API Endpoint**: `{{baseUrl}}/api/explore/canteens`
- **Response Format**: 
  ```json
  {
    "code": 1,
    "message": "Canteens Fetched Successfully",
    "data": [
      {
        "CanteenName": "Tree",
        "Location": "Tree Block",
        "fromTime": "",
        "ToTime": "",
        "accessTo": "ALL",
        "poster": "/images/canteens/2.jpeg"
      }
    ]
  }
  ```

### Updated Components

1. **Category Interface**: Updated to match your API response structure
2. **Canteen Interface**: Updated to match your API response structure
3. **Homepage Categories Section**: Now displays category images from `poster` field and shows item count
4. **Homepage Canteens Section**: Now displays only canteen name, location instead of prep time, and from/to time with 4.5+ rating
5. **API Service**: Added new endpoints for canteen item categories and explore canteens
6. **FoodItemCard**: Updated to handle both `canteen` and `canteenName` properties

### Features

- Categories are fetched from your API endpoint
- Fallback to mock data if API is unavailable
- Displays category images and item counts
- Responsive grid layout for categories
- Error handling for API failures

## Development

1. Copy `.env.local.example` to `.env.local`
2. Update the API URL in `.env.local`
3. Run the development server: `npm run dev` 