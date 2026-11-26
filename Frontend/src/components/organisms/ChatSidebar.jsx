// Job: 1v1 Chat left sidebar organism containing search, conversation tabs, chat list, friend requests, and suggestions
import React from "react";
import SearchInput from "../atoms/SearchInput";
import Button from "../atoms/Button";
import ChatListItem from "./ChatListItem";
import FriendSuggestionCard from "./FriendSuggestionCard";
import Avatar from "../atoms/Avatar";
import EmptyState from "../atoms/EmptyState";
import Spinner from "../atoms/Spinner";
import { MessageSquare, Gift, Sparkles, RefreshCw, UserCheck, Search } from "lucide-react";

export default function ChatSidebar({
  activeChat,
  onSelectChat,
  searchTerm,
  onChangeSearch,
  onClearSearch,
  activeTab, // "chats" | "requests"
  onChangeTab,
  filteredChats = [],
  loadingChats = false,
  pendingRequests = [],
  onAcceptRequest,
  onDeclineRequest,
  suggestions = [],
  loadingSuggestions = false,
  onRefreshSuggestions,
  onAddFriend,
  searchResults = [],
  loadingSearch = false,
  actionLoading = false,
  visibleSuggestionsCount = 6,
  onSeeMoreSuggestions,
  onOpenInvite,
  className = "",
}) {
  const isSearching = Boolean(searchTerm?.trim());

  return (
    <div className={`flex flex-col h-full bg-white select-none ${className}`}>
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            1v1 Chats
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenInvite}
            className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 rounded-full"
          >
            <Gift className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Invite & Earn
          </Button>
        </div>

        {/* Search Bar */}
        <SearchInput
          value={searchTerm}
          onChange={(e) => onChangeSearch?.(e.target.value)}
          onClear={onClearSearch}
          placeholder="Find people by name, email, or phone..."
        />

        {/* Tabs: Conversations vs Requests */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onChangeTab?.("chats")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center cursor-pointer ${
              activeTab === "chats"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Conversations
          </button>
          <button
            type="button"
            onClick={() => onChangeTab?.("requests")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "requests"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>Requests</span>
            {pendingRequests?.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Middle Scrollable Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isSearching ? (
          /* Search Results */
          <div className="p-3 space-y-3">
            {loadingSearch ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                <Spinner size="md" />
                <span>Searching users by name, email, or phone...</span>
              </div>
            ) : (
              <>
                {filteredChats.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase px-1 tracking-wider block">
                      Conversations ({filteredChats.length})
                    </span>
                    <div className="space-y-1">
                      {filteredChats.map((c) => (
                        <ChatListItem
                          key={c.user?._id}
                          chat={c}
                          isSelected={activeChat?._id === c.user?._id}
                          onClick={() => onSelectChat?.(c.user)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase px-1 tracking-wider flex items-center justify-between">
                    <span>People in Dar-ul-Ameen ({searchResults.length})</span>
                    <span className="text-[9px] text-slate-400 font-normal lowercase">by Name, Email, Phone</span>
                  </div>

                  {searchResults.length === 0 && filteredChats.length === 0 ? (
                    <EmptyState
                      icon={Search}
                      title="No people found"
                      description={`No users matched "${searchTerm}". Try searching by Full Name, Email, or Phone.`}
                      className="py-8"
                    />
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((item) => (
                        <FriendSuggestionCard
                          key={item.user?._id}
                          item={item}
                          onAddFriend={onAddFriend}
                          onAcceptRequest={onAcceptRequest}
                          onOpenChat={() => onSelectChat?.(item.user)}
                          isLoading={actionLoading}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : activeTab === "requests" ? (
          /* Friend Requests */
          <div className="p-3 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase px-2 mb-2 tracking-wider block">
              Friend Requests ({pendingRequests?.length || 0})
            </span>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No pending friend requests.
              </div>
            ) : (
              pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar src={req.requester?.picture} size="md" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-slate-800 truncate">
                        {req.requester?.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-500 capitalize">
                        {Array.isArray(req.requester?.role) ? req.requester?.role[0] : req.requester?.role || "Student"}
                        {req.requester?.city && ` • ${req.requester?.city}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onAcceptRequest?.(req._id)}
                      isLoading={actionLoading}
                      className="flex-1 text-xs"
                    >
                      <UserCheck className="w-3 h-3 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeclineRequest?.(req._id)}
                      isLoading={actionLoading}
                      className="flex-1 text-xs"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Active Conversations */
          <>
            {loadingChats ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading chats...
              </div>
            ) : filteredChats.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No active 1v1 conversations yet"
                description="Connect with classmates or teachers below to start chatting!"
                className="py-12"
              />
            ) : (
              filteredChats.map((c) => (
                <ChatListItem
                  key={c.user?._id}
                  chat={c}
                  isSelected={activeChat?._id === c.user?._id}
                  onClick={() => onSelectChat?.(c.user)}
                />
              ))
            )}
          </>
        )}

        {/* Bottom Section: People You May Know */}
        {!isSearching && activeTab === "chats" && (
          <div className="p-3 bg-slate-50/70 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                People You May Know
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">1v1 Only</span>
                <button
                  type="button"
                  title="Refresh suggestions"
                  onClick={onRefreshSuggestions}
                  disabled={loadingSuggestions}
                  className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingSuggestions ? "animate-spin text-emerald-600" : ""}`} />
                </button>
              </div>
            </div>

            {loadingSuggestions ? (
              <div className="py-5 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                <Spinner size="sm" />
                <span className="text-[11px]">Finding suggested connections...</span>
              </div>
            ) : !suggestions || suggestions.length === 0 ? (
              <div className="text-center py-4 text-[11px] text-slate-400">
                No new suggestions at this moment.
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.slice(0, visibleSuggestionsCount).map((item) => (
                  <FriendSuggestionCard
                    key={item.user?._id}
                    item={item}
                    onAddFriend={onAddFriend}
                    onAcceptRequest={onAcceptRequest}
                    onOpenChat={() => onSelectChat?.(item.user)}
                    isLoading={actionLoading}
                  />
                ))}

                {suggestions.length > visibleSuggestionsCount && (
                  <button
                    type="button"
                    onClick={onSeeMoreSuggestions}
                    className="w-full py-1.5 text-center text-xs text-emerald-600 font-semibold hover:underline cursor-pointer"
                  >
                    See More Suggestions ({suggestions.length - visibleSuggestionsCount} more)
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
