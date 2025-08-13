import React, { useEffect, useMemo, useState } from "react";
import AsyncSelect from "react-select/async";
import type { SingleValue } from "react-select";

interface Props {
  division: string;
  department: string;
  store: string;
  camera: string;
  onChange: (vals: {
    division: string;
    department: string;
    store: string;
    camera: string;
  }) => void;
}

type Option = { value: string; label: string };

async function fetchItems(url: string): Promise<string[]> {
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return json.items || [];
}

export const HierarchyFilters: React.FC<Props> = ({
  division,
  department,
  store,
  camera,
  onChange,
}) => {
  const [divisionOptions, setDivisionOptions] = useState<Option[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<Option[]>([]);
  const [storeOptions, setStoreOptions] = useState<Option[]>([]);
  const [cameraOptions, setCameraOptions] = useState<Option[]>([]);

  const [loading, setLoading] = useState({
    d: false,
    dep: false,
    s: false,
    c: false,
  });

  const toOptions = (items: string[]) =>
    items.map((v) => ({ value: v, label: v }));

  useEffect(() => {
    (async () => {
      setLoading((l) => ({ ...l, d: true }));
      const items = await fetchItems("/api/v1/analytics/filters/divisions");
      setDivisionOptions(toOptions(items));
      setLoading((l) => ({ ...l, d: false }));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading((l) => ({ ...l, dep: true }));
      const q = division ? `?division=${encodeURIComponent(division)}` : "";
      const items = await fetchItems(
        `/api/v1/analytics/filters/departments${q}`,
      );
      setDepartmentOptions(toOptions(items));
      setLoading((l) => ({ ...l, dep: false }));
      onChange({ division, department: "", store: "", camera: "" });
      setStoreOptions([]);
      setCameraOptions([]);
    })();
  }, [division]);

  useEffect(() => {
    (async () => {
      setLoading((l) => ({ ...l, s: true }));
      const params = new URLSearchParams();
      if (division) params.append("division", division);
      if (department) params.append("department", department);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const items = await fetchItems(`/api/v1/analytics/filters/stores${qs}`);
      setStoreOptions(toOptions(items));
      setLoading((l) => ({ ...l, s: false }));
      onChange({ division, department, store: "", camera: "" });
      setCameraOptions([]);
    })();
  }, [department]);

  useEffect(() => {
    (async () => {
      setLoading((l) => ({ ...l, c: true }));
      const params = new URLSearchParams();
      if (division) params.append("division", division);
      if (department) params.append("department", department);
      if (store) params.append("store", store);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const items = await fetchItems(`/api/v1/analytics/filters/cameras${qs}`);
      setCameraOptions(toOptions(items));
      setLoading((l) => ({ ...l, c: false }));
      onChange({ division, department, store, camera: "" });
    })();
  }, [store]);

  const loadDivisions = async (input: string) => {
    const q = input ? `?search=${encodeURIComponent(input)}` : "";
    const items = await fetchItems(`/api/v1/analytics/filters/divisions${q}`);
    return toOptions(items);
  };
  const loadDepartments = async (input: string) => {
    const params = new URLSearchParams();
    if (division) params.append("division", division);
    if (input) params.append("search", input);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const items = await fetchItems(
      `/api/v1/analytics/filters/departments${qs}`,
    );
    return toOptions(items);
  };
  const loadStores = async (input: string) => {
    const params = new URLSearchParams();
    if (division) params.append("division", division);
    if (department) params.append("department", department);
    if (input) params.append("search", input);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const items = await fetchItems(`/api/v1/analytics/filters/stores${qs}`);
    return toOptions(items);
  };
  const loadCameras = async (input: string) => {
    const params = new URLSearchParams();
    if (division) params.append("division", division);
    if (department) params.append("department", department);
    if (store) params.append("store", store);
    if (input) params.append("search", input);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const items = await fetchItems(`/api/v1/analytics/filters/cameras${qs}`);
    return toOptions(items);
  };

  const selectedDivision = division
    ? { value: division, label: division }
    : null;
  const selectedDepartment = department
    ? { value: department, label: department }
    : null;
  const selectedStore = store ? { value: store, label: store } : null;
  const selectedCamera = camera ? { value: camera, label: camera } : null;

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="min-w-[220px]">
        <label className="text-sm text-gray-700 mb-1 block">Division</label>
        <AsyncSelect
          cacheOptions
          defaultOptions={divisionOptions}
          isClearable
          isSearchable
          isLoading={loading.d}
          value={selectedDivision}
          onChange={(opt: SingleValue<Option>) =>
            onChange({
              division: opt?.value || "",
              department: "",
              store: "",
              camera: "",
            })
          }
          loadOptions={loadDivisions}
          placeholder="All divisions"
        />
      </div>
      <div className="min-w-[220px]">
        <label className="text-sm text-gray-700 mb-1 block">Department</label>
        <AsyncSelect
          cacheOptions
          defaultOptions={departmentOptions}
          isClearable
          isSearchable
          isDisabled={!division}
          isLoading={loading.dep}
          value={selectedDepartment}
          onChange={(opt: SingleValue<Option>) =>
            onChange({
              division,
              department: opt?.value || "",
              store: "",
              camera: "",
            })
          }
          loadOptions={loadDepartments}
          placeholder="All departments"
        />
      </div>
      <div className="min-w-[220px]">
        <label className="text-sm text-gray-700 mb-1 block">Store</label>
        <AsyncSelect
          cacheOptions
          defaultOptions={storeOptions}
          isClearable
          isSearchable
          isDisabled={!department}
          isLoading={loading.s}
          value={selectedStore}
          onChange={(opt: SingleValue<Option>) =>
            onChange({
              division,
              department,
              store: opt?.value || "",
              camera: "",
            })
          }
          loadOptions={loadStores}
          placeholder="All stores"
        />
      </div>
      <div className="min-w-[260px]">
        <label className="text-sm text-gray-700 mb-1 block">Camera</label>
        <AsyncSelect
          cacheOptions
          defaultOptions={cameraOptions}
          isClearable
          isSearchable
          isDisabled={!store}
          isLoading={loading.c}
          value={selectedCamera}
          onChange={(opt: SingleValue<Option>) =>
            onChange({ division, department, store, camera: opt?.value || "" })
          }
          loadOptions={loadCameras}
          placeholder="All cameras"
        />
      </div>
    </div>
  );
};
