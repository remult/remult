# PreprocessFilterInfo
Provides additional information and utilities for preprocessing filters in API and backend operations.
## metadata
Metadata of the entity being filtered.
## getFilterInfo
Retrieves filter information for a given filter or the current filter being preprocessed if no filter is provided.
   
   
   #### returns:
   A promise that resolves to a FilterInfo object containing the filter information.
   
   FilterInfo

Arguments:
* **filter** - Optional filter to analyze. If not provided, the current filter being preprocessed is used.
