import { TestComponent } from "@/components/tost";
import { InputField } from "@/components/ui/shared/input/generic-input";
import { SearchInput } from "@/components/ui/shared/input/search-input";
import { Logo } from "@/components/ui/shared/logo/logo";
import { FilterIcon, Lock, Mail, Phone } from "lucide-react";

const PreviewsPage = () => {
  return (
    <div className="max-w-2xl mx-auto ">
      {/* Input fields */}
      <form className="space-y-4">
        <InputField
          label="Email Address"
          type="email"
          required
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
          helperText="We'll never share your email"
        />

        <InputField
          label="Password"
          type="password"
          required
          showPasswordToggle
          leftIcon={<Lock className="h-4 w-4" />}
          //   error={errors.password}
          inputClassName="font-mono"
        />

        <InputField
          label="Phone Number"
          type="tel"
          leftIcon={<Phone className="h-4 w-4" />}
          success="Phone number verified"
          containerClassName="col-span-2"
          className="rounded-sm py-4"
        />
      </form>
      {/* search input field */}
      <div className="space-y-4">
        <SearchInput
          placeholder="Search users..."
          // onSearchDebounced={(val) => console.log("debounced:", val)}
        />
        <SearchInput
          value={""}
          // onChange={(e, val) => setQuery(val)}
          // onSearch={(val) => fetchResults(val)}
          // onClear={() => setQuery("")}
        />
        {/* // ── 3. With Loading ── */}
        <SearchInput
          // loading={isSearching}
          placeholder="Search products..."
          // onSearchDebounced={(val) => searchProducts(val)}
          debounceTime={500}
          minLength={3}
        />
        {/* // ── 4. With Validation ── */}
        <SearchInput
          label="Search Email"
          error="No results found"
          helperText="Try a different keyword"
          // onSearch={(val) => validateSearch(val)}
        />
        {/* // ── 5. Custom Icons ── */}
        <SearchInput
          // searchIcon={<MyCustomSearchIcon />}
          // clearIcon={<MyCustomClearIcon />}
          showClearButton
        />
        {/* // ── 6. No Search Icon + Right Loader ── */}
        <SearchInput
          hideSearchIcon
          // loading={isLoading}
          rightIcon={<FilterIcon />}
        />
        {/* // ── 7. Search on Enter only (no debounce) ── */}
        <SearchInput
          placeholder="Press Enter to search..."
          searchOnEnter
          // onSearch={(val) => handleSearch(val)}
        />
        {/* // ── 8. Full Featured ── */}
        <SearchInput
          label="Search Orders"
          required
          placeholder="Order ID, customer name..."
          // loading={isFetching}
          // error={searchError}
          // success={searchSuccess}
          helperText="Min 3 characters"
          minLength={3}
          debounceTime={400}
          showClearButton
          // onSearchDebounced={(val) => debouncedSearch(val)}
          // onSearch={(val) => immediateSearch(val)}
          // onClear={(val) => resetSearch()}
          containerClassName="max-w-md"
          inputClassName="rounded-full"
          searchIconClassName="text-blue-500"
        />
      </div>
      {/* logo  */}
      <div className="bg-black">
        {/* // Normal — clickable, links to / */}
        <Logo size="lg" className="" />
        {/* // Disabled — no link, just image, faded */}
        <Logo disabled />
        {/* // Disabled + custom size */}
        <Logo disabled size="lg" />

        <TestComponent />
      </div>
    </div>
  );
};

export default PreviewsPage;
