// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ update: vi.fn(), refresh: vi.fn(), success: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success } }));
vi.mock("../src/features/service/api", () => ({ updateServiceStatusApi: mocks.update }));
import { PublicationCard } from "../src/components/shared/publication-card";
import { ServicePublicationCard } from "../src/features/service/service-publication-card";

beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
describe("publication card", () => {
  it("publishes through the dedicated endpoint then refreshes the service details", async () => {
    render(createElement(ServicePublicationCard, { salonId: "salon", serviceId: "service", status: "DRAFT", salonIsLive: true }));
    await userEvent.click(screen.getByRole("button", { name: "Publish service" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
    expect(mocks.update).toHaveBeenCalledWith("salon", "service", "PUBLISHED");
  });
  it("keeps errors visible and allows retry without claiming success", async () => {
    mocks.update.mockRejectedValue(new Error("Permission denied"));
    render(createElement(ServicePublicationCard, { salonId: "salon", serviceId: "service", status: "DRAFT", salonIsLive: true }));
    await userEvent.click(screen.getByRole("button", { name: "Publish service" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Permission denied");
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
  });
  it("disables the action while its request is pending", async () => {
    let finish!: () => void;
    const action = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    render(createElement(PublicationCard, { title: "Draft", description: "Private", action: { label: "Publish", onClick: action } }));
    await userEvent.click(screen.getByRole("button", { name: "Publish" }));
    const pending = screen.getByRole("button", { name: "Publishing…" }) as HTMLButtonElement;
    expect(pending.disabled).toBe(true);
    await userEvent.click(pending);
    expect(action).toHaveBeenCalledOnce();
    finish();
    await waitFor(() => expect((screen.getByRole("button", { name: "Publish" }) as HTMLButtonElement).disabled).toBe(false));
  });
  it("explains the salon gate without offering a redundant publish action", () => {
    render(createElement(ServicePublicationCard, { salonId: "salon", serviceId: "service", status: "PUBLISHED", salonIsLive: false }));
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText(/once your salon is live/)).toBeTruthy();
  });
});
