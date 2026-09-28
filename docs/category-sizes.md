# Optional category sizes

Category selection opens /choose-size only when the API category has a nonempty sizes array. The size screen refreshes the category and skips itself if its sizes were removed. Missing, null and empty sizes enter the builder directly.

Tapping a size card highlights it and shows its backend measurement and component limit. Continue to Builder stays disabled until a size is selected, so customers can compare sizes before continuing.

The existing persisted builder state holds the complete selectedSize object (id, name, measurement, unit, maxItems). A new category clears any previous selection. The builder and preview use selectedSize.maxItems; add and insert operations enforce the same limit in the store. Each placed component represents one quantity. ProductItems are still grouped exactly as before, and editing expands their quantities back into individual components. Replacement, removal, repositioning and history keep their existing behavior. Unsized designs have no size cap.

Multipart Product saves include only selectedSizeId when a size is selected. Measurement, unit and maxItems are never submitted as configuration. The server resolves the size. Editing restores the Product.selectedSize snapshot, even if the category sizes have since changed. The normal backend response remains authoritative for saved prices, stock, and validation errors.

Live GET /categories now returns configured Bracelet sizes; other categories currently return sizes: null. Measurement and unit are displayed exactly as returned. Configure unit as cm (not a combined value such as 24cm), with the numeric value in measurement.
