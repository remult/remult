# PreprocessFilterInfo
Provides additional information and utilities for preprocessing filters in API and backend operations.
## metadata
Metadata of the entity being filtered.
## getFilterPreciseValues
Retrieves precise values for each property in a filter for an entity.
   
   
   #### returns:
   A promise that resolves to a FilterPreciseValues object containing the precise values for each property.
   
   FilterInfo

Arguments:
* **filter** - Optional filter to analyze. If not provided, the current filter being preprocessed is used.
