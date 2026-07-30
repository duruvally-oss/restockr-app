import React, { useState } from "react";
import { Staff, StaffPermission } from "../types";
import { 
  Users, Phone, Shield, ShieldCheck, Trash2, Edit3, Save, X, Plus, 
  AlertCircle, CheckCircle, ShieldAlert, UserPlus, ToggleLeft, ToggleRight,
  Briefcase, Calendar
} from "lucide-react";
import { db } from "../lib/database";

interface StaffManagerProps {
  shopId: string;
  staffList: Staff[];
  onSaveStaff: (member: Staff) => void;
  onDeleteStaff: (id: string) => void;
}

const DEFAULT_PERMISSIONS: StaffPermission = {
  addProduct: true,
  editProduct: true,
  sellProduct: true,
  registerCustomer: true,
  receiveRepairs: true,
  updateRepairStatus: true,
  viewInventory: true,
  checkPrices: true,
  viewProductDetails: true,
  deleteProduct: false,
};

const PERMISSION_LABELS: Record<keyof StaffPermission, { label: string; desc: string }> = {
  addProduct: { label: "Add Products", desc: "Allows uploading new device listings to the shop inventory via WhatsApp." },
  editProduct: { label: "Edit Products", desc: "Allows editing existing product specifications, prices, or quantities via WhatsApp." },
  sellProduct: { label: "Sell Products", desc: "Allows registering customer sales and updating inventory counts via WhatsApp." },
  registerCustomer: { label: "Register Customers", desc: "Allows registering new customer profiles with phone numbers via WhatsApp." },
  receiveRepairs: { label: "Receive Repairs", desc: "Allows logging received customer repair devices with issues via WhatsApp." },
  updateRepairStatus: { label: "Update Repair Status", desc: "Allows updating repair tracking logs and statuses via WhatsApp." },
  viewInventory: { label: "View Inventory", desc: "Allows querying active stock ledger counts and available devices via WhatsApp." },
  checkPrices: { label: "Check Prices", desc: "Allows looking up selling prices of device models on-the-go via WhatsApp." },
  viewProductDetails: { label: "View Product Details", desc: "Allows viewing detailed device specs and storage variants via WhatsApp." },
  deleteProduct: { label: "Delete Products", desc: "Allows deleting product listings entirely from the shop ledger via WhatsApp." }
};

export default function StaffManager({
  shopId,
  staffList,
  onSaveStaff,
  onDeleteStaff
}: StaffManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [createdStaff, setCreatedStaff] = useState<Staff | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Suspended">("Active");
  const [formPermissions, setFormPermissions] = useState<StaffPermission>({ ...DEFAULT_PERMISSIONS });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation modal state for deletion
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);

  const resetForm = () => {
    setEditingStaff(null);
    setFormName("");
    setFormPhone("");
    setFormRole("");
    setFormStatus("Active");
    setFormPermissions({ ...DEFAULT_PERMISSIONS });
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditStaff = (member: Staff) => {
    setEditingStaff(member);
    setFormName(member.fullName);
    setFormPhone(member.phoneNumber);
    setFormRole(member.role || "");
    setFormStatus(member.status);
    setFormPermissions({
      ...DEFAULT_PERMISSIONS,
      ...member.permissions
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (member: Staff) => {
    const nextStatus = member.status === "Active" ? "Suspended" : "Active";
    const updated: Staff = {
      ...member,
      status: nextStatus
    };
    onSaveStaff(updated);
    
    // Add informational system notification
    db.addNotification(
      member.shop_id,
      `Staff Status Changed`,
      `Staff member ${member.fullName} has been ${nextStatus.toLowerCase()} by owner.`,
      nextStatus === "Active" ? "success" : "warning"
    );

    setSuccessNotification(`Successfully ${nextStatus === "Active" ? "activated" : "suspended"} ${member.fullName}!`);
    setTimeout(() => setSuccessNotification(null), 3000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Strict Validation
      if (!formName.trim()) {
        setFormError("Full Name is required.");
        return;
      }
      if (!formPhone.trim()) {
        setFormError("WhatsApp Mobile Number is required.");
        return;
      }

      // Clean Phone Number: remove spaces, ensure starts with optional + and followed by 8-15 digits
      const phoneClean = formPhone.replace(/\s+/g, "").trim();
      if (!/^\+?[0-9]{8,15}$/.test(phoneClean)) {
        setFormError("Invalid WhatsApp number format. Please use digits with optional '+' prefix (e.g., +2348031234567).");
        return;
      }

      // Check duplicate phone number
      const isDuplicate = staffList.some(s => s.phoneNumber.replace(/\s+/g, "") === phoneClean && s.id !== editingStaff?.id);
      if (isDuplicate) {
        setFormError(`The WhatsApp number ${phoneClean} is already registered to another staff member.`);
        return;
      }

      const generatedId = `STF-${Math.floor(100000 + Math.random() * 900000)}`;

      const staffData: Staff = {
        id: editingStaff?.id || generatedId,
        shop_id: editingStaff?.shop_id || shopId,
        fullName: formName.trim(),
        phoneNumber: phoneClean,
        role: formRole.trim() || undefined,
        status: formStatus,
        permissions: formPermissions,
        createdAt: editingStaff?.createdAt || new Date().toISOString()
      };

      onSaveStaff(staffData);
      setIsModalOpen(false);
      
      // Show success banner feedback
      setSuccessNotification(`Successfully saved staff member "${staffData.fullName}"!`);
      setTimeout(() => setSuccessNotification(null), 4000);

      // Create persistent notification for owner
      db.addNotification(
        staffData.shop_id,
        editingStaff ? "Staff Profile Updated" : "New Staff Registered",
        `Staff profile for ${staffData.fullName} (${staffData.phoneNumber}) was successfully ${editingStaff ? "modified" : "created"}.`,
        "success"
      );

      // If registering a *new* staff member, show the detailed Success modal!
      if (!editingStaff) {
        setCreatedStaff(staffData);
      }

      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (key: keyof StaffPermission) => {
    setFormPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDeleteConfirm = (id: string, name: string) => {
    setConfirmDeleteId(id);
    setConfirmDeleteName(name);
  };

  const triggerDelete = () => {
    if (confirmDeleteId) {
      onDeleteStaff(confirmDeleteId);
      
      setSuccessNotification(`Staff member "${confirmDeleteName}" removed successfully.`);
      setTimeout(() => setSuccessNotification(null), 3000);

      setConfirmDeleteId(null);
      setConfirmDeleteName(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white" id="staff-management-module">
      
      {/* SUCCESS NOTIFICATION TOAST */}
      {successNotification && (
        <div className="fixed top-6 right-6 z-50 bg-[#16A34A] text-white border border-[#22C55E] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-scale-up">
          <CheckCircle className="w-5 h-5 text-white" />
          <span className="text-xs font-bold font-display uppercase tracking-wider">{successNotification}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="staff-header-section">
        <div>
          <h1 className="text-2xl font-display font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-400" /> WhatsApp Staff Directory
          </h1>
          <p className="text-sm text-[#B7BCC7] mt-1">
            Register sales assistants. Staff members interact exclusively through the <b className="text-teal-400 font-semibold">RESTOCKR WhatsApp Assistant</b> and have no web dashboard logins.
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#00C896] text-[#0F1115] hover:bg-[#00b084] px-5 py-3 rounded-xl transition-all font-bold font-display uppercase text-xs tracking-wider cursor-pointer shadow-lg shadow-[#00C896]/10"
          id="btn-register-staff-trigger"
        >
          <UserPlus className="w-4.5 h-4.5 text-[#0F1115]" /> Register Staff Member
        </button>
      </div>

      {/* Educational Notice Banner - No login capability emphasizes structural focus */}
      <div className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-5 flex items-start gap-4">
        <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-teal-400 shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-['Arial_Black'] font-black uppercase text-white tracking-wider">
            🔒 Direct WhatsApp Integration Architecture
          </h4>
          <p className="text-xs text-[#B7BCC7] leading-relaxed">
            Unlike traditional systems with emails, passwords, or employee dashboards, Restockr utilizes a zero-friction phone matching system. Staff members perform stock updates, sales records, and condition checks entirely inside <b>WhatsApp</b>. Restricting, suspending, or authorizing commands takes effect instantly from this owner panel.
          </p>
        </div>
      </div>

      {/* Staff Grid List */}
      {staffList.length === 0 ? (
        <div className="bg-[#121212] border border-[#2A2A2A] rounded-[20px] py-16 text-center text-[#B7BCC7] shadow-lg">
          <Users className="w-12 h-12 text-[#2A2A2A] mx-auto mb-4" />
          <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">No staff profiles registered</h3>
          <p className="text-xs text-[#B7BCC7] mt-1.5 max-w-md mx-auto leading-relaxed">
            Register your sales reps or catalog managers by their active WhatsApp phone number to enable instant remote assistant operations.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-6 px-4 py-2 bg-[#1B1B1B] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-colors"
          >
            Register First Staff
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="staff-cards-grid">
          {staffList.map(member => {
            // Count allowed toggles
            const allowedCount = Object.keys(member.permissions || {}).filter(
              key => member.permissions[key]
            ).length;

            const displayDate = new Date(member.createdAt || Date.now()).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "short",
              day: "numeric"
            });

            return (
              <div 
                key={member.id} 
                className={`bg-[#121212] border rounded-[22px] p-6 shadow-xl hover:border-zinc-700 transition-all flex flex-col justify-between space-y-5 ${
                  member.status === "Suspended" ? "border-rose-950/70 opacity-75 bg-[#121212]/90" : "border-[#2A2A2A]"
                }`}
                id={`staff-card-${member.id}`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display font-black text-base text-white truncate flex items-center gap-2">
                        {member.fullName}
                        {member.status === "Active" ? (
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shrink-0" title="Active on WhatsApp" />
                        ) : (
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full shrink-0" title="Suspended" />
                        )}
                      </h3>
                      
                      {member.role && (
                        <p className="text-[10px] uppercase font-mono tracking-wider text-teal-400 font-bold mt-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3 shrink-0" /> {member.role}
                        </p>
                      )}
                    </div>

                    <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider font-mono rounded-lg shrink-0 border ${
                      member.status === "Active" 
                        ? "bg-[#1B1B1B] border-emerald-950 text-emerald-400" 
                        : "bg-[#1B1B1B] border-rose-950 text-rose-400"
                    }`}>
                      {member.status}
                    </span>
                  </div>

                  {/* WhatsApp Details */}
                  <div className="bg-[#1B1B1B] border border-[#2A2A2A] rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#B7BCC7] font-medium flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-teal-500" /> WhatsApp:
                      </span>
                      <span className="font-bold font-mono text-white text-right select-all">
                        {member.phoneNumber}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] border-t border-[#2A2A2A] pt-2">
                      <span className="text-[#B7BCC7]/60 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#B7BCC7]/40" /> Date Added:
                      </span>
                      <span className="font-semibold text-[#B7BCC7]">{displayDate}</span>
                    </div>
                  </div>

                  {/* WhatsApp Permissions Summary */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] uppercase font-mono tracking-widest font-bold text-zinc-500 flex items-center justify-between">
                      <span>WhatsApp Permissions</span>
                      <span className="text-teal-400 font-extrabold">{allowedCount} Enabled</span>
                    </p>
                    
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                      {Object.keys(PERMISSION_LABELS).map(key => {
                        const isAllowed = member.permissions?.[key];
                        if (!isAllowed) return null;
                        const label = PERMISSION_LABELS[key as keyof StaffPermission]?.label || key;
                        return (
                          <span 
                            key={key} 
                            className="bg-[#1B1B1B] border border-[#2A2A2A]/80 text-[#B7BCC7] text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            🟢 {label}
                          </span>
                        );
                      })}
                      {allowedCount === 0 && (
                        <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wider font-mono bg-rose-950/20 px-2 py-1 rounded border border-rose-950/40 w-full text-center">
                          🚫 No Active permissions
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Card Action footer */}
                <div className="flex items-center gap-2 pt-4 border-t border-[#2A2A2A]/40 shrink-0">
                  <button
                    onClick={() => handleEditStaff(member)}
                    className="flex-1 py-2.5 px-3 bg-[#1B1B1B] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-xl text-xs font-bold font-display uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    title="Edit rules"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>

                  <button
                    onClick={() => handleToggleStatus(member)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase font-mono tracking-wider border cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
                      member.status === "Active" 
                        ? "bg-rose-950/10 hover:bg-rose-950/20 border-rose-900/40 text-rose-400" 
                        : "bg-emerald-950/10 hover:bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
                    }`}
                    title={member.status === "Active" ? "Suspend user" : "Activate user"}
                  >
                    {member.status === "Active" ? (
                      <>
                        <ToggleRight className="w-4.5 h-4.5" /> Suspend
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4.5 h-4.5" /> Activate
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteConfirm(member.id, member.fullName)}
                    className="p-2.5 border border-[#2A2A2A] hover:border-rose-900/60 hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 rounded-xl cursor-pointer transition-colors"
                    title="Delete Staff"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT STAFF MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in" id="staff-form-modal">
          <div className="bg-[#121212] border border-[#3F3F46] rounded-[24px] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up text-white" id="staff-modal-container">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-[#2A2A2A] bg-[#1B1B1B] rounded-t-2xl flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-display font-black text-xs uppercase tracking-widest text-teal-400 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  {editingStaff ? "Edit Staff Configuration" : "Register WhatsApp Sales rep"}
                </h3>
                <h2 className="text-lg font-black font-display uppercase tracking-tight text-white">
                  {editingStaff ? "Configure Staff Privileges" : "Add Staff Member"}
                </h2>
                <p className="text-[11px] text-[#B7BCC7]">Configure permissions for instant remote ledger interaction.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-[#2A2A2A] text-[#B7BCC7] hover:text-white rounded-xl cursor-pointer transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              
              {formError && (
                <div className="p-3 bg-rose-950/40 border border-rose-900 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                  <span className="font-bold">{formError}</span>
                </div>
              )}

              {/* Profile Details Inputs */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wider block border-b border-[#2A2A2A] pb-1.5">
                  General Profile Info
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Full Name field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase text-[#B7BCC7] block">
                      Full Name <span className="text-rose-500 font-extrabold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chukwudi Obi"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                    />
                  </div>

                  {/* WhatsApp Number field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase text-[#B7BCC7] block">
                      WhatsApp Mobile Number <span className="text-rose-500 font-extrabold">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +2348031234567"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-mono font-bold"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  
                  {/* Staff Role field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase text-[#B7BCC7] block flex items-center justify-between">
                      <span>Staff Role / Title</span>
                      <span className="text-[9px] text-[#B7BCC7]/40 font-normal capitalize">Optional</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Sales Agent, Tech Rep"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Account Status field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase text-[#B7BCC7] block">
                      Account Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as "Active" | "Suspended")}
                      className="w-full px-3.5 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                    >
                      <option value="Active">🟢 Active</option>
                      <option value="Suspended">🔴 Suspended</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Permissions checkboxes list */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wider block border-b border-[#2A2A2A] pb-1.5">
                  Configure WhatsApp Conversational Toggles
                </h4>
                
                <div className="divide-y divide-[#2A2A2A]/60 max-h-[300px] overflow-y-auto pr-2">
                  {(Object.keys(PERMISSION_LABELS) as Array<keyof StaffPermission>).map(key => {
                    const info = PERMISSION_LABELS[key];
                    const isSelected = formPermissions[key];
                    return (
                      <div key={key} className="py-3 flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="font-display font-black text-xs text-white uppercase tracking-wider">{info.label}</span>
                          <p className="text-[10px] text-[#B7BCC7] leading-relaxed max-w-sm">{info.desc}</p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => togglePermission(key)}
                          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                            isSelected ? "bg-[#00C896]" : "bg-zinc-800/80 border border-[#2A2A2A]"
                          }`}
                        >
                          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            isSelected ? "translate-x-5" : "translate-x-0"
                          }`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-[#2A2A2A] pt-5 flex justify-end gap-2 shrink-0 bg-[#121212]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#2A2A2A] text-[#B7BCC7] hover:bg-[#1B1B1B] hover:text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#00C896] text-[#0F1115] hover:bg-[#00b084] rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-[#00C896]/10"
                  id="btn-save-staff-submit"
                >
                  <Save className="w-4 h-4 text-[#0F1115]" /> {editingStaff ? "Save Staff" : "Create Staff"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deletion */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#121212] border-2 border-[#3F3F46] rounded-[20px] p-6 shadow-2xl animate-scale-up space-y-5 text-white">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-500 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black font-display text-white uppercase tracking-wider">Remove Staff Profile?</h3>
                <p className="text-xs text-[#B7BCC7] leading-relaxed">
                  Are you sure you want to completely delete <b className="text-white font-bold">{confirmDeleteName}</b>? This action will immediately revoke all WhatsApp operating capabilities.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteId(null);
                  setConfirmDeleteName(null);
                }}
                className="px-4 py-2.5 bg-[#1B1B1B] border border-[#2A2A2A] hover:bg-zinc-800 text-[#B7BCC7] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={triggerDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-lg shadow-rose-600/10"
              >
                Remove Staff
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL FOR NEW CREATED STAFF */}
      {createdStaff && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" id="staff-success-modal">
          <div className="w-full max-w-lg bg-[#121212] border-2 border-emerald-500 rounded-[24px] p-6 shadow-2xl animate-scale-up space-y-6 text-white relative overflow-hidden">
            
            {/* Success Badge */}
            <div className="flex items-center gap-4 border-b border-[#2A2A2A] pb-5">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shrink-0">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">OPERATOR CREATED</span>
                <h3 className="text-xl font-black font-display text-white uppercase tracking-tight">Staff Created Successfully</h3>
              </div>
            </div>

            {/* Profile Details */}
            <div className="bg-[#1B1B1B] border border-[#2A2A2A] rounded-2xl p-5 space-y-4 font-mono text-xs">
              
              <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-3">
                <span className="text-[#B7BCC7]">Staff Name:</span>
                <span className="font-bold text-white text-right">{createdStaff.fullName}</span>
              </div>

              <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-3">
                <span className="text-[#B7BCC7]">Staff ID:</span>
                <span className="font-black text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/30 text-right">{createdStaff.id}</span>
              </div>

              <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-3">
                <span className="text-[#B7BCC7]">WhatsApp Number:</span>
                <span className="font-bold text-white text-right select-all">{createdStaff.phoneNumber}</span>
              </div>

              <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-3">
                <span className="text-[#B7BCC7]">Account Status:</span>
                <span className="font-bold uppercase tracking-wider text-emerald-400 text-right">🟢 {createdStaff.status}</span>
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-[#B7BCC7] block pb-1">Assigned Permissions:</span>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                  {Object.keys(PERMISSION_LABELS).map(key => {
                    const isAllowed = createdStaff.permissions?.[key as keyof StaffPermission];
                    if (!isAllowed) return null;
                    const label = PERMISSION_LABELS[key as keyof StaffPermission]?.label || key;
                    return (
                      <span key={key} className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        ✓ {label}
                      </span>
                    );
                  })}
                  {Object.keys(createdStaff.permissions || {}).filter(k => createdStaff.permissions[k as keyof StaffPermission]).length === 0 && (
                    <span className="text-zinc-500 italic">None</span>
                  )}
                </div>
              </div>

            </div>

            <p className="text-[11px] text-[#B7BCC7] leading-relaxed text-center bg-[#1B1B1B]/40 p-3 rounded-xl border border-[#2A2A2A]">
              💡 The newly registered sales rep can immediately interact with the <b>RESTOCKR Assistant</b> on WhatsApp.
            </p>

            {/* Actions */}
            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                onClick={() => setCreatedStaff(null)}
                className="w-full sm:w-auto px-8 py-3 bg-[#00C896] hover:bg-[#00b084] text-[#0F1115] rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors text-center shadow-lg shadow-[#00C896]/10"
              >
                Okay, Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
